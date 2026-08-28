-- Supabase/Postgres schema for RecruitAI. Safe to re-run.
-- Apply via the Supabase SQL editor or `supabase db push`.
--
-- Tables are created in dependency order: tenants -> profiles -> candidates
-- -> screening_results -> job_descriptions.

-- ===========================================================================
-- TENANTS AND PROFILES
-- One tenant per company, created automatically when a user signs up.
-- ===========================================================================

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

-- ===========================================================================
-- CANDIDATES AND SCREENING RESULTS
-- ===========================================================================

-- candidates: one row per submitted candidate + job description pair
create table if not exists public.candidates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  name        text not null,
  email       text not null,
  position    text not null,
  cv_text     text not null,
  jd_text     text not null,
  status      text not null default 'pending'
              check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at  timestamptz default now()
);

-- screening_results: AI screening output for a candidate (written by n8n callback)
create table if not exists public.screening_results (
  id                      uuid primary key default gen_random_uuid(),
  candidate_id            uuid not null references public.candidates (id) on delete cascade,
  tenant_id               uuid not null references public.tenants (id),
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

-- ===========================================================================
-- SAVED JOB DESCRIPTIONS
-- Reusable job descriptions ("Positions") that HR saves once and reuses
-- when screening candidates.
-- ===========================================================================

create table if not exists public.job_descriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id),
  title       text not null,
  jd_text     text not null,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists profiles_tenant_idx
  on public.profiles (tenant_id);

create index if not exists candidates_tenant_created_idx
  on public.candidates (tenant_id, created_at desc);

create index if not exists screening_results_candidate_idx
  on public.screening_results (candidate_id);

create index if not exists job_descriptions_tenant_created_idx
  on public.job_descriptions (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Signup trigger
-- Creates a tenant named after company_name metadata (fallback: email),
-- then the profile that links the new user to it.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
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
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- All candidate data goes through Next.js server code using the service role
-- key, so anon and authenticated get no access to those tables. Signed-in
-- users can read only their own profile and tenant.
-- ---------------------------------------------------------------------------
alter table public.tenants           enable row level security;
alter table public.profiles          enable row level security;
alter table public.candidates        enable row level security;
alter table public.screening_results enable row level security;
alter table public.job_descriptions  enable row level security;

drop policy if exists "service_role full access" on public.tenants;
create policy "service_role full access"
  on public.tenants for all to service_role using (true) with check (true);

drop policy if exists "service_role full access" on public.profiles;
create policy "service_role full access"
  on public.profiles for all to service_role using (true) with check (true);

drop policy if exists "service_role full access" on public.candidates;
create policy "service_role full access"
  on public.candidates for all to service_role using (true) with check (true);

drop policy if exists "service_role full access" on public.screening_results;
create policy "service_role full access"
  on public.screening_results for all to service_role using (true) with check (true);

drop policy if exists "service_role full access" on public.job_descriptions;
create policy "service_role full access"
  on public.job_descriptions for all to service_role using (true) with check (true);

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

-- ---------------------------------------------------------------------------
-- Upgrade path for databases created by an earlier version of this file,
-- where candidates.tenant_id had a placeholder default and no foreign key.
-- Nothing here runs on a fresh database.
-- ---------------------------------------------------------------------------
do $mig$
declare
  orphans bigint;
begin
  alter table public.candidates        alter column tenant_id drop default;
  alter table public.screening_results alter column tenant_id drop default;

  if not exists (
    select 1 from pg_constraint where conname = 'candidates_tenant_id_fkey'
  ) then
    select count(*) into orphans
      from public.candidates c
      left join public.tenants t on t.id = c.tenant_id
      where t.id is null;

    if orphans > 0 then
      raise notice
        'Skipped candidates_tenant_id_fkey: % candidate row(s) reference a tenant that does not exist. Delete them, then re-run this script.',
        orphans;
    else
      alter table public.candidates
        add constraint candidates_tenant_id_fkey
        foreign key (tenant_id) references public.tenants (id);
    end if;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'screening_results_tenant_id_fkey'
  ) then
    select count(*) into orphans
      from public.screening_results s
      left join public.tenants t on t.id = s.tenant_id
      where t.id is null;

    if orphans > 0 then
      raise notice
        'Skipped screening_results_tenant_id_fkey: % result row(s) reference a tenant that does not exist. Delete them, then re-run this script.',
        orphans;
    else
      alter table public.screening_results
        add constraint screening_results_tenant_id_fkey
        foreign key (tenant_id) references public.tenants (id);
    end if;
  end if;
end;
$mig$;
