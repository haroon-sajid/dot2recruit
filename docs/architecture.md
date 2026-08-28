# RecruitAI Architecture

This document describes how the parts of RecruitAI fit together and what happens during a single screening. See the README for setup and API details.

## Components

| Part | Where it runs | What it does |
| --- | --- | --- |
| Next.js app | Vercel | Serves the UI and the API routes. Holds all server-side database access. |
| Supabase | Supabase cloud | Postgres storage, authentication, row level security. |
| n8n workflow | Railway | Runs the screening pipeline. Calls OpenAI and posts the result back. |
| OpenAI API | OpenAI | Scores the CV against the job description. |

## System diagram

```
   Browser
      |
      | 1. submit candidate
      v
+---------------------------+   auth, read, write   +----------------------------+
|  Next.js app on Vercel    | <-------------------> |  Supabase                  |
|                           |                       |  auth, Postgres, RLS       |
|  /new-candidate           |                       |                            |
|  /candidates              |                       |  candidates                |
|  /candidates/[id]         |                       |  screening_results         |
|  /api/candidates          |                       |  tenants                   |
|  /api/webhook/result      |                       |  profiles                  |
+---------------------------+                       +----------------------------+
      |                  ^
      | 2. trigger       | 5. callback with result
      |    webhook       |    POST /api/webhook/result
      |    + secret      |    + secret
      v                  |
+-------------------------------------------+
|  n8n workflow on Railway                  |
|                                           |
|  Webhook                                  |
|    -> Verify Secret                       |
|      -> Build AI Request                  |
|        -> Call OpenAI ---------+          |
|          -> Parse and Validate |          |
|            -> Send Result      |          |
|            -> Mark Failed <----+ on error |
+-------------------------------------------+
      |
      | 3. chat completion request
      v
+---------------------------+
|  OpenAI API, gpt-4o-mini  |
+---------------------------+
```

## Data flow for one screening

1. **Submit.** HR fills the form at `/new-candidate`. The browser validates with zod, then posts to `POST /api/candidates`.

2. **Save.** The API route resolves the signed-in user and their tenant, validates the body again on the server, and inserts a `candidates` row with status `pending`.

3. **Trigger.** The same request posts the candidate id, CV text, job description text, position and tenant id to the n8n webhook URL, with the shared secret in the `x-webhook-secret` header. The call has a 15 second timeout. On success the candidate status is set to `processing` and the route returns `201` with the new id. On failure the candidate is set to `failed` and the route returns `502`.

4. **Screen.** n8n verifies the secret, builds the prompt, and calls the OpenAI chat completions endpoint with `gpt-4o-mini`, `temperature` `0` and JSON mode. It then parses the response and validates the score, the decision value, and the shape of every field.

5. **Callback.** n8n posts `{ candidateId, result }` to `POST /api/webhook/result` with the shared secret. The route compares the secret in constant time, validates the payload with zod, inserts a `screening_results` row, and sets the candidate status to `completed`.

6. **Failure path.** If the OpenAI call fails after its retries, or the response does not parse or validate, n8n posts `{ candidateId, result: null }` to the same callback. The route rejects the null result but reads the candidate id and sets the status to `failed`.

7. **Display.** The page at `/candidates/[id]` polls `GET /api/candidates/[id]` every 3 seconds while the status is `pending` or `processing`. It stops on `completed` or `failed`, and gives up after 3 minutes with a manual retry button. Once complete it renders the score, the decision, the six analysis sections, and the interview recommendation.

## Data model

- `tenants`: one row per company. Created by a trigger when a user signs up.
- `profiles`: one row per auth user, linking the user to a tenant.
- `candidates`: the submitted candidate, CV text, job description text, and status.
- `screening_results`: the AI output for a candidate, including score, decision, and the analysis fields.

Both `candidates` and `screening_results` carry a `tenant_id`. Every query filters on the tenant of the signed-in user.

## Security model

- Row level security is enabled on all four tables. No policy grants access to the anon or authenticated roles for candidate data, so the public key cannot read it.
- All reads and writes go through Next.js server code using the service role key, which is never sent to the browser.
- `src/proxy.ts` refreshes the session on every request. Unauthenticated page requests redirect to `/login` and unauthenticated API requests return `401`. The landing page, the auth pages, and the n8n callback are the only public paths.
- The n8n callback authenticates with a shared secret compared using `timingSafeEqual`, not with a session.

## Statuses

| Status | Meaning |
| --- | --- |
| `pending` | Candidate saved, screening not yet triggered. |
| `processing` | n8n accepted the trigger and the screening is running. |
| `completed` | A result was stored. |
| `failed` | The trigger could not be delivered, or the workflow reported an error. |
