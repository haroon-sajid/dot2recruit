-- Supabase/Postgres schema for RecruitAI (candidates, screening results).
-- Apply via the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- candidates: one row per submitted candidate + job description pair
-- ---------------------------------------------------------------------------
create table if not exists public.candidates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null default '00000000-0000-0000-0000-000000000001',
  name        text not null,
  email       text not null,
  position    text not null,
  cv_text     text not null,
  jd_text     text not null,
  status      text not null default 'pending'
              check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- screening_results: AI screening output for a candidate (written by n8n callback)
-- ---------------------------------------------------------------------------
create table if not exists public.screening_results (
  id                      uuid primary key default gen_random_uuid(),
  candidate_id            uuid not null references public.candidates (id) on delete cascade,
  tenant_id               uuid not null default '00000000-0000-0000-0000-000000000001',
  overall_score           int not null check (overall_score between 0 and 100),
  relevant_experience     text,
  technical_skills_match  text,
  education_match         text,
  missing_skills          text[],
  strengths               text[],
  concerns                text[],
  decision                text not null
                          check (decision in ('strong_match', 'potential_match', 'not_a_match')),
  decision_reason         text not null,
  interview_recommended   boolean,
  approval_status         text not null default 'pending_review'
                          check (approval_status in ('pending_review', 'approved', 'rejected')),
  created_at              timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists candidates_tenant_created_idx
  on public.candidates (tenant_id, created_at desc);

create index if not exists screening_results_candidate_idx
  on public.screening_results (candidate_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The app never talks to the database from the browser. All access goes through
-- Next.js server code (API routes / server components) using the service role
-- key, so RLS is enabled to block the anon/authenticated roles entirely and a
-- single permissive policy grants service_role full access. (service_role also
-- bypasses RLS by default; the explicit policy documents intent and keeps the
-- tables safe if that default is ever changed.)
-- ---------------------------------------------------------------------------
alter table public.candidates        enable row level security;
alter table public.screening_results enable row level security;

create policy "service_role full access"
  on public.candidates
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role full access"
  on public.screening_results
  for all
  to service_role
  using (true)
  with check (true);