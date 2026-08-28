-- Supabase/Postgres schema for RecruitAI. Safe to re-run.
-- Apply via the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- candidates: one row per submitted candidate + job description pair
-- ---------------------------------------------------------------------------
create table if not exists public.candidates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
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
  tenant_id               uuid not null,
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
-- All DB access goes through Next.js server code with the service role key,
-- so anon/authenticated get no access to these tables.
-- ---------------------------------------------------------------------------
alter table public.candidates        enable row level security;
alter table public.screening_results enable row level security;

drop policy if exists "service_role full access" on public.candidates;
create policy "service_role full access"
  on public.candidates
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role full access" on public.screening_results;
create policy "service_role full access"
  on public.screening_results
  for all
  to service_role
  using (true)
  with check (true);


-- ===========================================================================
-- AUTH + MULTI-TENANCY
-- One tenant per company, created automatically when a user signs up.
-- ===========================================================================

-- tenants
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- profiles: one per auth user, links the user to a tenant
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  tenant_id   uuid not null references public.tenants (id),
  full_name   text,
  created_at  timestamptz default now()
);

create index if not exists profiles_tenant_idx on public.profiles (tenant_id);

-- On signup: create a tenant named after company_name metadata (fallback: email), then the profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_company   text := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
  v_full_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  insert into public.tenants (name)
  values (coalesce(v_company, new.email))
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (new.id, v_tenant_id, v_full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- tenant_id now comes from the signed-in user's profile; drop the old placeholder default
alter table public.candidates        alter column tenant_id drop default;
alter table public.screening_results alter column tenant_id drop default;

-- Link tenant_id to tenants. Rows created with the old placeholder tenant
-- ('00000000-0000-0000-0000-000000000001') must be deleted before this runs.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'candidates_tenant_id_fkey') then
    alter table public.candidates
      add constraint candidates_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'screening_results_tenant_id_fkey') then
    alter table public.screening_results
      add constraint screening_results_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id);
  end if;
end;
$$;

-- RLS: service_role full access; signed-in users can read their own profile and tenant
alter table public.tenants  enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "service_role full access" on public.tenants;
create policy "service_role full access"
  on public.tenants
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role full access" on public.profiles;
create policy "service_role full access"
  on public.profiles
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users read own tenant" on public.tenants;
create policy "users read own tenant"
  on public.tenants
  for select
  to authenticated
  using (id in (select tenant_id from public.profiles where id = auth.uid()));
