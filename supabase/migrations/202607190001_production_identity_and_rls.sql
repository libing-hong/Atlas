-- Atlas production identity and persistence foundation. Additive and localStorage-compatible.
create extension if not exists "pgcrypto";

create unique index if not exists users_auth_user_id_idx on public.users(auth_user_id);

create table if not exists public.advisor_assignments (
  id uuid primary key default gen_random_uuid(), advisor_user_id uuid not null references public.users(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade, assigned_by uuid references public.users(id), created_at timestamptz not null default now(),
  unique(advisor_user_id, student_user_id), check (advisor_user_id <> student_user_id)
);
create table if not exists public.planning_runs (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.users(id) on delete cascade,
  profile_snapshot jsonb not null default '{}'::jsonb, status text not null default 'draft' check(status in ('draft','running','completed','failed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.recommendation_runs (
  id uuid primary key default gen_random_uuid(), planning_run_id uuid not null references public.planning_runs(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade, status text not null default 'pending', model_name text, prompt_version text,
  created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.recommendation_candidates (
  id uuid primary key default gen_random_uuid(), recommendation_run_id uuid not null references public.recommendation_runs(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade, institution_name text not null, programme_name text not null, country text not null,
  verification_status text not null check(verification_status in ('verified','partially_verified','pending','rejected')), payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.programme_verifications (
  id uuid primary key default gen_random_uuid(), candidate_id uuid references public.recommendation_candidates(id) on delete cascade,
  status text not null check(status in ('verified','partially_verified','pending','rejected')), official_url text, evidence jsonb not null default '[]'::jsonb,
  verified_by uuid references public.users(id), verified_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.application_records (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.users(id) on delete cascade,
  recommendation_candidate_id uuid references public.recommendation_candidates(id) on delete set null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'preparing', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.users(id) on delete cascade,
  service_type text not null, status text not null default 'draft', amount_fen integer, currency text not null default 'CNY', payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null, policy_version text not null, granted boolean not null, recorded_at timestamptz not null default now(), unique(owner_user_id, consent_type, policy_version)
);
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references public.users(id) on delete cascade,
  request_type text not null check(request_type in ('access','export','correction','deletion','restriction')), status text not null default 'submitted',
  created_at timestamptz not null default now(), resolved_at timestamptz
);
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.users(id), subject_user_id uuid references public.users(id),
  action text not null, resource_type text not null, resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.current_atlas_user_id() returns uuid language sql stable security definer set search_path = public
as $$ select id from public.users where auth_user_id = auth.uid() $$;
create or replace function public.current_atlas_role() returns text language sql stable security definer set search_path = public
as $$ select role from public.users where auth_user_id = auth.uid() $$;
create or replace function public.can_access_student(target uuid) returns boolean language sql stable security definer set search_path = public
as $$ select target = public.current_atlas_user_id() or public.current_atlas_role() = 'admin' or exists(select 1 from public.advisor_assignments a where a.advisor_user_id = public.current_atlas_user_id() and a.student_user_id = target) $$;

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.advisor_assignments enable row level security;
alter table public.planning_runs enable row level security;
alter table public.recommendation_runs enable row level security;
alter table public.recommendation_candidates enable row level security;
alter table public.programme_verifications enable row level security;
alter table public.application_records enable row level security;
alter table public.materials enable row level security;
alter table public.service_orders enable row level security;
alter table public.consents enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.audit_events enable row level security;

create policy users_read_scope on public.users for select using (public.can_access_student(id));
create policy profiles_read_scope on public.student_profiles for select using (public.can_access_student(user_id));
create policy profiles_owner_write on public.student_profiles for all using (user_id = public.current_atlas_user_id()) with check (user_id = public.current_atlas_user_id());
create policy assignments_staff_read on public.advisor_assignments for select using (advisor_user_id = public.current_atlas_user_id() or public.current_atlas_role() = 'admin');
create policy assignments_admin_write on public.advisor_assignments for all using (public.current_atlas_role() = 'admin') with check (public.current_atlas_role() = 'admin');
create policy planning_scope on public.planning_runs for all using (public.can_access_student(owner_user_id)) with check (owner_user_id = public.current_atlas_user_id() or public.current_atlas_role() = 'admin');
create policy recommendation_runs_scope on public.recommendation_runs for all using (public.can_access_student(owner_user_id)) with check (owner_user_id = public.current_atlas_user_id() or public.current_atlas_role() = 'admin');
create policy recommendation_candidates_scope on public.recommendation_candidates for select using (public.can_access_student(owner_user_id));
create policy recommendation_candidates_staff_write on public.recommendation_candidates for all using (public.current_atlas_role() = 'admin') with check (public.current_atlas_role() = 'admin');
create policy verifications_staff_only on public.programme_verifications for all using (public.current_atlas_role() = 'admin') with check (public.current_atlas_role() = 'admin');
create policy application_scope on public.application_records for all using (public.can_access_student(owner_user_id)) with check (owner_user_id = public.current_atlas_user_id() or public.current_atlas_role() = 'admin');
create policy material_scope on public.materials for all using (exists(select 1 from public.student_profiles p where p.id = student_profile_id and public.can_access_student(p.user_id))) with check (exists(select 1 from public.student_profiles p where p.id = student_profile_id and p.user_id = public.current_atlas_user_id()));
create policy orders_scope on public.service_orders for select using (public.can_access_student(owner_user_id));
create policy orders_owner_create on public.service_orders for insert with check (owner_user_id = public.current_atlas_user_id());
create policy consents_owner_scope on public.consents for all using (owner_user_id = public.current_atlas_user_id()) with check (owner_user_id = public.current_atlas_user_id());
create policy privacy_owner_scope on public.privacy_requests for all using (owner_user_id = public.current_atlas_user_id()) with check (owner_user_id = public.current_atlas_user_id());
create policy audit_admin_read on public.audit_events for select using (public.current_atlas_role() = 'admin');

insert into storage.buckets(id, name, public) values ('atlas-private-materials','atlas-private-materials',false) on conflict(id) do update set public=false;
create policy private_material_read on storage.objects for select using (bucket_id='atlas-private-materials' and public.can_access_student((storage.foldername(name))[1]::uuid));
create policy private_material_owner_write on storage.objects for insert with check (bucket_id='atlas-private-materials' and (storage.foldername(name))[1]::uuid = public.current_atlas_user_id());
