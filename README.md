# RecruitAI

Live demo: https://dot2recruit.vercel.app

Demo video: link will be added.

## 1. Project Overview

RecruitAI is a recruitment screening tool for HR teams. An HR user submits a candidate CV and the job description for the role, and the app starts an automated screening workflow. That workflow sends both documents to a language model, which compares the CV against the job description and returns a structured assessment. HR then sees a match score from 0 to 100, a detailed analysis covering experience, skills, education, strengths and gaps, and a hiring recommendation with a written reason.

The app is multi-tenant. Each company signs up with its own login, and a tenant is created for it automatically. Candidates and screening results are only visible to the company that submitted them.

## 2. Architecture

The app has three parts: a Next.js application deployed on Vercel, a Supabase project for authentication and data, and an n8n workflow on Railway that runs the AI screening.

The screening is asynchronous. When HR submits a candidate, the Next.js API saves the record and triggers the n8n webhook, then returns immediately. The browser polls for the result while n8n calls OpenAI in the background. When n8n finishes, it posts the result back to the app, which stores it in Supabase.

```
   Browser
      |
      v
+---------------------------+          +----------------------------+
|  Next.js app on Vercel    | -------> |  Supabase                  |
|  pages + API routes       |  <-----  |  auth, Postgres, RLS       |
+---------------------------+          +----------------------------+
      |                  ^
      | 2. trigger       | 5. callback
      |    webhook       |    POST /api/webhook/result
      v                  |
+---------------------------+
|  n8n workflow on Railway  |
+---------------------------+
      |
      | 3. chat completion request
      v
+---------------------------+
|  OpenAI API, gpt-4o-mini  |
+---------------------------+
```

Data flow for one screening:

1. HR submits the form. `POST /api/candidates` validates the input, saves the candidate with status `pending`, and returns the new id.
2. The same request triggers the n8n webhook with the CV, the job description, and the candidate id. The candidate status becomes `processing`.
3. n8n builds the prompt and calls the OpenAI chat completions endpoint.
4. n8n parses and validates the model response against the expected shape.
5. n8n posts the result to `POST /api/webhook/result`. The app stores it and sets the status to `completed`, or `failed` if something went wrong.
6. The candidate detail page polls `GET /api/candidates/[id]` every 3 seconds and renders the result once the status is no longer in progress.

See `docs/architecture.md` for more detail on each step.

## 3. Technologies Used

- **Next.js 16** with the App Router. Serves the UI and the API routes from one deployment.
- **TypeScript**. Shared types between the API, the database rows, and the components.
- **Tailwind CSS 4**. Utility styling, no separate design system to maintain.
- **Supabase**. Postgres for storage, plus hosted authentication and row level security.
- **n8n on Railway**. Runs the screening pipeline as a visual workflow that can be edited without redeploying the app.
- **OpenAI gpt-4o-mini**. The model that scores the CV against the job description.
- **Vercel**. Hosting for the Next.js app.
- **zod**. Validates the submission form and the incoming webhook payload at runtime.

## 4. Setup Instructions

1. Clone the repository and install dependencies.

   ```bash
   git clone <your-repo-url>
   cd recruit-ai
   npm install
   ```

2. Create a Supabase project at https://supabase.com.

3. Open the SQL editor in the Supabase dashboard, paste the contents of `supabase/schema.sql`, and run it. This creates the `candidates`, `screening_results`, `tenants` and `profiles` tables, enables row level security, and installs the trigger that creates a tenant on signup. The script is safe to run more than once.

4. In the Supabase dashboard, go to Authentication, then URL Configuration, and set the Site URL. Use `http://localhost:3000` for local development and your deployed URL in production.

5. Copy the environment file and fill in the values.

   ```bash
   cp .env.example .env.local
   ```

6. Import the workflow into n8n. In n8n choose Import from File and select `n8n/screening-workflow.json`.

7. Replace the placeholders in the imported workflow:
   - In the **Call OpenAI** node, replace `REPLACE_WITH_OPENAI_API_KEY` in the Authorization header with your OpenAI key. Keep the `Bearer ` prefix.
   - In the **Verify Secret**, **Send Result** and **Mark Failed** nodes, replace `REPLACE_WITH_WEBHOOK_SECRET` with your own secret. Use the same value in three places, and set `N8N_WEBHOOK_SECRET` in `.env.local` to that same value.
   - In the **Send Result** and **Mark Failed** nodes, change the URL to your own deployment if you are not using the demo URL.

8. Activate the workflow in n8n. Copy the production URL from the Webhook node and put it in `N8N_WEBHOOK_URL`.

9. Start the app.

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, create an account, and submit a candidate.

### Environment variables

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. Safe to expose to the browser. | Supabase dashboard, Project Settings, API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key used by the browser client. Row level security limits what it can read. | Supabase dashboard, Project Settings, API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key that bypasses row level security. Never expose this to the browser. | Supabase dashboard, Project Settings, API |
| `DATABASE_URL` | Postgres connection string. Only needed if you want to run `schema.sql` from the command line instead of the SQL editor. | Supabase dashboard, Project Settings, Database |
| `N8N_WEBHOOK_URL` | Production webhook URL of the screening workflow. | n8n, Webhook node, Production URL |
| `N8N_WEBHOOK_SECRET` | Shared secret sent in the `x-webhook-secret` header. Must match the value inside the n8n workflow. | You choose it. Use a long random string. |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app. | `http://localhost:3000` locally, your Vercel URL in production |

The OpenAI key is not read by the Next.js app. It is set inside the n8n workflow, in the Call OpenAI node.

## 5. API Configuration

All candidate routes require a signed-in session. The proxy in `src/proxy.ts` rejects unauthenticated API requests with 401. The webhook route is the exception: it is reachable without a session and authenticates with a shared secret instead.

### POST /api/candidates

Creates a candidate and starts the screening. Auth: session cookie.

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "position": "Full-Stack AI Automation Developer",
  "cvText": "Full CV text, at least 50 characters",
  "jdText": "Full job description text, at least 50 characters"
}
```

Returns `201` with `{ "id": "<uuid>" }`. Returns `400` with field errors if validation fails. Returns `502` if the candidate was saved but the n8n webhook could not be reached, in which case the candidate is marked `failed`.

### GET /api/candidates

Returns every candidate in the signed-in user's tenant, newest first, each with its latest screening result. Auth: session cookie.

### GET /api/candidates/[id]

Returns one candidate with its latest screening result. Auth: session cookie. Returns `404` if the candidate does not exist or belongs to another tenant. The candidate detail page polls this route while a screening is running.

### POST /api/webhook/result

Receives the finished screening from n8n. Auth: the `x-webhook-secret` header, compared against `N8N_WEBHOOK_SECRET` using a constant-time comparison.

Request body:

```json
{
  "candidateId": "<uuid>",
  "result": {
    "overall_score": 82,
    "relevant_experience": "Text describing relevant experience.",
    "technical_skills_match": "Text comparing CV skills to JD skills.",
    "education_match": "Text, or a note that education is not mentioned.",
    "missing_skills": ["Kubernetes"],
    "strengths": ["Five years of Next.js experience"],
    "concerns": ["No evidence of team leadership"],
    "decision": "strong_match",
    "decision_reason": "Text explaining the decision.",
    "interview_recommended": true
  }
}
```

On success the result is stored and the candidate status becomes `completed`. If the payload fails validation but contains a valid `candidateId`, the candidate is marked `failed`. This is how the workflow reports an error, by posting `result: null`.

### GET /api/me

Returns `{ email, fullName, companyName }` for the signed-in user. Used by the settings page.

## 6. AI Model Used

The screening uses OpenAI **gpt-4o-mini**.

Reasons for this choice:

- **Cost.** Each screening sends a full CV and job description, so input tokens add up quickly. gpt-4o-mini keeps the cost per screening low enough to run on every applicant.
- **Speed.** Screening finishes in a few seconds, which keeps the polling window short.
- **Structured output.** The task is extraction and comparison against a fixed schema, not open-ended writing. The model handles that reliably at this size.
- **JSON mode.** The request sets `response_format: { "type": "json_object" }`, so the model is constrained to return valid JSON.
- **Consistency.** `temperature` is set to `0` so the same CV and job description produce the same score on repeated runs. This matters for a scoring tool, where reviewers need to trust that the number is stable.

## 7. Prompt Used

This is the system prompt sent with every screening. It lives in the **Build AI Request** node in `n8n/screening-workflow.json`.

```text
You are an expert HR recruitment screening assistant. Your job is to evaluate a candidate's CV against a specific Job Description (JD) and produce a structured, evidence-based assessment.

STRICT RULES:
1. Base every statement ONLY on information explicitly present in the CV and JD. Never assume, infer, or invent skills, experience, or qualifications that are not written in the CV.
2. If information is missing from the CV (for example education or a required skill), state that it is "not mentioned in the CV" instead of guessing.
3. Separate facts from interpretation: when you assess fit, refer to the exact evidence in the CV that supports it.
4. Evaluate the candidate ONLY against the provided JD, not against a generic idea of the role.
5. Output MUST be valid JSON matching the exact schema below. No markdown, no code fences, no text before or after the JSON.

SCORING GUIDE:
- 90-100: meets nearly all requirements with strong evidence
- 75-89: meets most core requirements
- 50-74: meets some requirements, notable gaps
- 25-49: limited overlap with requirements
- 0-24: little to no relevant match

DECISION RULES:
- overall_score >= 75: "strong_match"
- overall_score 50-74: "potential_match"
- overall_score < 50: "not_a_match"
- interview_recommended: true if overall_score >= 60, otherwise false

OUTPUT SCHEMA (JSON only):
{
  "overall_score": <integer 0-100>,
  "relevant_experience": "<2-4 sentences, facts from CV relevant to JD>",
  "technical_skills_match": "<2-4 sentences comparing CV skills to JD skills>",
  "education_match": "<1-3 sentences, or state not mentioned in CV>",
  "missing_skills": ["<JD requirement not evidenced in CV>"],
  "strengths": ["<strength with CV evidence>"],
  "concerns": ["<gap or risk based on CV vs JD>"],
  "decision": "strong_match" | "potential_match" | "not_a_match",
  "decision_reason": "<3-5 sentences explaining the decision, citing specific evidence from the CV and specific JD requirements>"
}
```

The user message is built separately and contains the job description, the CV, and the position title, in that order.

### Why the prompt is designed this way

The main risk in CV screening is a model that fills in gaps with plausible guesses. A candidate who never mentions a degree should not be described as having one. Rule 1 blocks invention outright, and rule 2 gives the model an explicit alternative, which is to say the information is not mentioned. Without that alternative, models tend to guess rather than leave a field empty.

Rule 3 separates facts from interpretation. The model is allowed to judge fit, but it has to point at the evidence in the CV that supports the judgement. This is what makes the output reviewable. An HR user can check a claim against the CV instead of trusting the score.

Rule 4 anchors the evaluation to the job description that was actually submitted. Models have strong priors about what a job title means, and without this rule a screening for a specific role drifts toward a generic version of that role.

The scoring guide and decision rules exist to make results comparable between candidates. Score bands and thresholds are stated as numbers, so the same evidence maps to the same band every time rather than depending on how the model feels about a candidate. The fixed output schema plus JSON mode means the API route can validate the response with zod and store it directly, with no parsing of free text.

## 8. Automation Workflow

The workflow is exported to `n8n/screening-workflow.json`. It has seven nodes and runs in this order.

1. **Webhook.** Receives `POST` on the path `recruitai-screening`. The body carries `candidateId`, `cvText`, `jdText`, `position` and `tenantId`.

2. **Verify Secret.** An IF node that compares the `x-webhook-secret` header against the shared secret. Only the true branch continues. The false branch is not connected, so an unauthenticated call stops here and does nothing.

3. **Build AI Request.** A Code node. It checks that `candidateId`, `cvText` and `jdText` are present and throws if any is missing. It then assembles the system prompt and the user message and outputs the full request body, with `model` set to `gpt-4o-mini`, `temperature` `0`, `max_tokens` `2000`, and `response_format` set to `json_object`.

4. **Call OpenAI.** An HTTP request to `https://api.openai.com/v1/chat/completions` with a 60 second timeout. Retries are on, with 2 attempts and 3 seconds between them. On error the node continues down its error output rather than stopping the workflow.

5. **Parse and Validate.** A Code node that strips any code fences, parses the JSON, and checks the result. It rejects a missing or out-of-range `overall_score`, rounds the score to an integer, rejects a `decision` outside the three allowed values, and requires `decision_reason`. It coerces `missing_skills`, `strengths` and `concerns` to arrays of strings, sets the three text fields to null if they are not strings, and defaults `interview_recommended` to true when the score is 60 or above. On error it continues down its error output.

6. **Send Result.** Posts `{ candidateId, result }` to `/api/webhook/result` with the shared secret header and a 15 second timeout. Retries are on, with 3 attempts and 3 seconds between them.

7. **Mark Failed.** The failure path. Both the Call OpenAI error output and the Parse and Validate error output are wired to this node. It posts `{ candidateId, result: null }` to the same callback URL. The API route rejects the null result as invalid but reads the `candidateId` and sets the candidate status to `failed`, which is what the UI needs in order to stop polling and show an error. Retries are on, with 2 attempts, and the node is set to never error so a failed report cannot itself break the run.

Failures are therefore visible to the user rather than silent. If OpenAI is down, or returns something that is not valid JSON, or returns a score outside 0 to 100, the candidate ends up marked `failed` instead of sitting in `processing` forever. The app has its own guard for the case where n8n cannot be reached at all: the trigger has a 15 second timeout, and a failure there marks the candidate `failed` before the API responds.

## 9. Key Decisions

- **n8n for the screening pipeline.** The AI steps run in n8n rather than inside the Next.js app. The prompt, the model settings, and the retry rules can be read and changed in one place without redeploying the app. It also makes the automation visible, which is easier to review than the same logic buried in application code.

- **Webhook plus callback instead of a blocking call.** The submit request does not wait for the model. It saves the candidate, triggers the workflow, and returns. n8n posts the result back when it is ready. This keeps the request short, avoids serverless timeout limits on long model calls, and means a slow screening does not hold a connection open.

- **Service role key only on the server.** All database access goes through Next.js server code using the service role key. Row level security is enabled on every table and no policy grants access to the anon or authenticated roles, so a leaked public key cannot read candidate data.

- **A tenant per signup.** A Postgres trigger creates a tenant and a profile when a user signs up. Every candidate and result row carries a `tenant_id`, and every query filters on the tenant of the signed-in user. This keeps company data separated from the first request.

- **Status field drives the UI.** Candidates move through `pending`, `processing`, `completed` and `failed`. The detail page polls until the status leaves the in-progress states, with a 3 minute cutoff and a manual retry. Storing the state in the database rather than in the client means a user can close the tab and come back to a finished screening.

- **gpt-4o-mini for cost control.** A larger model would produce slightly better written analysis, but the task is structured comparison rather than open-ended writing. The smaller model does that well at a fraction of the cost, which matters when every applicant is screened.

- **Text input rather than file upload.** CVs and job descriptions are pasted as text. File parsing for PDF and Word documents is a known gap and is listed as planned work in the app.
