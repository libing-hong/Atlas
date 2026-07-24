-- Private Beta P0: canonical profile, recommendation traceability and final-offer visa state.

alter table public.student_profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb,
  add column if not exists profile_version integer not null default 1,
  add column if not exists recommendations_stale boolean not null default false;

alter table public.recommendation_runs
  add column if not exists rule_version text,
  add column if not exists error_code text,
  add column if not exists failed_stage text,
  add column if not exists request_started_at timestamptz,
  add column if not exists requires_manual_review boolean not null default false;

alter table public.application_records
  add column if not exists is_final_offer boolean not null default false,
  add column if not exists offer_verified_at timestamptz;

create unique index if not exists application_records_one_final_offer_per_owner
  on public.application_records(owner_user_id)
  where is_final_offer;

create table if not exists public.visa_cases (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  application_record_id uuid not null unique references public.application_records(id) on delete cascade,
  country public.target_country not null,
  rule_version text not null,
  status text not null default 'preparing' check (status in ('preparing', 'ready_to_apply', 'submitted', 'decision_received', 'needs_review', 'archived')),
  checklist jsonb not null default '[]'::jsonb,
  last_rule_verified_at timestamptz not null,
  archived_at timestamptz,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visa_cases enable row level security;
create policy visa_cases_scope on public.visa_cases for all
  using (public.can_access_student(owner_user_id))
  with check (owner_user_id = public.current_atlas_user_id() or public.current_atlas_role() = 'admin');

create table if not exists public.visa_rule_versions (
  id uuid primary key default gen_random_uuid(),
  country public.target_country not null,
  visa_type text not null,
  rule_version text not null unique,
  rules jsonb not null,
  effective_from date not null,
  effective_to date,
  verified_at timestamptz not null,
  official_sources jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.visa_tasks (
  id uuid primary key default gen_random_uuid(),
  visa_case_id uuid not null references public.visa_cases(id) on delete cascade,
  task_key text not null,
  status text not null check (status in ('not_applicable','waiting_for_dependency','not_started','atlas_processing','user_action_required','needs_confirmation','blocked','ready','completed','expired','needs_review')),
  dependencies jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(visa_case_id, task_key)
);

create table if not exists public.visa_materials (
  id uuid primary key default gen_random_uuid(),
  visa_case_id uuid not null references public.visa_cases(id) on delete cascade,
  material_key text not null,
  status text not null check (status in ('not_applicable','waiting_for_dependency','not_started','atlas_processing','user_action_required','needs_confirmation','blocked','ready','completed','expired','needs_review')),
  storage_path text,
  redacted_metadata jsonb not null default '{}'::jsonb,
  user_confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(visa_case_id, material_key)
);

alter table public.visa_rule_versions enable row level security;
alter table public.visa_tasks enable row level security;
alter table public.visa_materials enable row level security;
create policy visa_rule_versions_read on public.visa_rule_versions for select using (true);
create policy visa_tasks_scope on public.visa_tasks for all
  using (exists(select 1 from public.visa_cases c where c.id = visa_case_id and public.can_access_student(c.owner_user_id)))
  with check (exists(select 1 from public.visa_cases c where c.id = visa_case_id and c.owner_user_id = public.current_atlas_user_id()));
create policy visa_materials_scope on public.visa_materials for all
  using (exists(select 1 from public.visa_cases c where c.id = visa_case_id and public.can_access_student(c.owner_user_id)))
  with check (exists(select 1 from public.visa_cases c where c.id = visa_case_id and c.owner_user_id = public.current_atlas_user_id()));

create or replace function public.mark_profile_recommendations_stale()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.profile_data is distinct from new.profile_data then
    new.profile_version := old.profile_version + 1;
    new.recommendations_stale := true;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_profile_invalidate_recommendations on public.student_profiles;
create trigger student_profile_invalidate_recommendations
before update on public.student_profiles
for each row execute function public.mark_profile_recommendations_stale();
