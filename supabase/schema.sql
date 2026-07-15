create extension if not exists "pgcrypto";

create type public.target_country as enum ('uk', 'france', 'australia');
create type public.application_status as enum ('preparing', 'submitted', 'reviewing', 'additional_materials', 'interview', 'offer', 'rejected');
create type public.material_status as enum ('not_uploaded', 'uploaded', 'reviewing', 'needs_update');
create type public.order_type as enum ('ai_report', 'diy_application', 'essay_service');
create type public.order_status as enum ('pending', 'paid', 'in_progress', 'completed', 'cancelled');
create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role text not null default 'student' check (role in ('student', 'advisor', 'admin')),
  name text not null,
  phone_wechat text,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  undergraduate_school text,
  undergraduate_major text,
  gpa text,
  language_score text,
  target_countries target_country[] not null default '{}',
  target_major text,
  budget text,
  intended_intake text,
  current_stage text not null default 'free_planning',
  paid_report boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  competitiveness_score int check (competitiveness_score between 0 and 100),
  country_fit jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  recommended_schools jsonb not null default '[]'::jsonb,
  summary text,
  is_unlocked boolean not null default false,
  model_name text,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  school_name text not null,
  country target_country not null,
  program_name text not null,
  status application_status not null default 'preparing',
  next_step text,
  deadline date,
  submitted_at timestamptz,
  result_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  material_type text not null check (material_type in ('passport', 'transcript', 'language_score', 'cv', 'ps', 'recommendation_letter')),
  status material_status not null default 'not_uploaded',
  file_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_profile_id, material_type)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  order_type order_type not null,
  amount numeric(10, 2) not null,
  currency text not null default 'CNY',
  status order_status not null default 'pending',
  mock_payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.advisor_notes (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  advisor_user_id uuid references public.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status task_status not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_student_profiles_user_id on public.student_profiles(user_id);
create index idx_ai_reports_student_profile_id on public.ai_reports(student_profile_id);
create index idx_applications_student_profile_id on public.applications(student_profile_id);
create index idx_materials_student_profile_id on public.materials(student_profile_id);
create index idx_orders_student_profile_id on public.orders(student_profile_id);
create index idx_tasks_student_profile_id on public.tasks(student_profile_id);

create table public.universities (
  id text primary key,
  canonical_name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.university_aliases (
  id uuid primary key default gen_random_uuid(),
  university_id text not null references public.universities(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

create table public.university_rankings (
  id uuid primary key default gen_random_uuid(),
  university_id text not null references public.universities(id) on delete cascade,
  ranking_provider text not null,
  ranking_year int not null,
  ranking_type text not null default 'overall' check (ranking_type in ('overall', 'subject', 'unavailable')),
  ranking_subject text,
  ranking_display text not null,
  university_canonical_name text not null,
  source_url text not null,
  source_checked_at timestamptz not null,
  verification_status text not null check (verification_status in ('verified', 'needs_review', 'unavailable_verified')),
  updated_at timestamptz not null default now(),
  unique (university_id, ranking_provider, ranking_year)
);

create table public.ranking_match_review_queue (
  id uuid primary key default gen_random_uuid(),
  submitted_name text not null,
  candidate_university_id text references public.universities(id) on delete set null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index idx_university_aliases_university_id on public.university_aliases(university_id);
create index idx_university_rankings_lookup on public.university_rankings(university_id, ranking_provider, ranking_year);


-- Program knowledge base. Public program content is separated from confidential admission rules.
create table public.programs (
  id text primary key,
  university_id text not null references public.universities(id) on delete cascade,
  canonical_name text not null,
  intake_year int not null,
  intake_term text not null check (intake_term in ('spring', 'summer', 'fall')),
  official_program_url text not null,
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, canonical_name, intake_year, intake_term)
);

create table public.program_content_profiles (
  program_id text primary key references public.programs(id) on delete cascade,
  introduction text not null,
  target_students text,
  learning_focus jsonb not null default '[]'::jsonb,
  learning_outcomes jsonb not null default '[]'::jsonb,
  practical_components jsonb not null default '[]'::jsonb,
  career_directions jsonb not null default '[]'::jsonb,
  duration_options jsonb not null default '[]'::jsonb,
  accreditation jsonb not null default '[]'::jsonb,
  teaching_location text,
  teaching_format text,
  official_curriculum_url text,
  source_retrieved_at timestamptz not null,
  last_verified_at timestamptz not null,
  verification_status text not null check (verification_status in ('verified_official', 'partially_verified', 'pending_review', 'outdated')),
  coverage_status text not null check (coverage_status in ('verified', 'partially_verified', 'fetching', 'manual_review', 'source_unavailable', 'not_available')),
  updated_at timestamptz not null default now()
);

create table public.program_course_modules (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.programs(id) on delete cascade,
  code text,
  name text not null,
  credits numeric(6, 2),
  module_type text not null check (module_type in ('core', 'optional', 'project', 'internship', 'dissertation')),
  display_order int not null default 0,
  source_url text not null,
  last_verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.program_requirement_sets (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.programs(id) on delete cascade,
  applicant_country text not null,
  degree_requirement text,
  academic_requirement jsonb not null default '{}'::jsonb,
  subject_background jsonb not null default '{}'::jsonb,
  language_requirement jsonb not null default '{}'::jsonb,
  work_experience_requirement jsonb not null default '{}'::jsonb,
  prerequisite_requirement jsonb not null default '{}'::jsonb,
  materials_requirement jsonb not null default '{}'::jsonb,
  tuition jsonb not null default '{}'::jsonb,
  deadline jsonb not null default '{}'::jsonb,
  official_source_url text not null,
  last_verified_at timestamptz not null,
  verification_status text not null check (verification_status in ('verified_official', 'partially_verified', 'pending_review', 'outdated')),
  unique (program_id, applicant_country)
);

-- Never expose rows from this table to browser clients. Only server-side jobs and decision functions may query it.
create table private_institution_admission_rules (
  id uuid primary key default gen_random_uuid(),
  target_university_id text not null references public.universities(id) on delete cascade,
  faculty_name text,
  program_id text references public.programs(id) on delete cascade,
  rule_type text not null check (rule_type in ('explicit_institution_list', 'tier_list', '985_211_double_first_class', 'key_non_key_institution', 'all_recognized_institutions', 'case_by_case', 'program_specific')),
  accepted_institution_id text,
  institution_tier text,
  required_average numeric(5, 2),
  required_average_max numeric(5, 2),
  source_year int,
  verification_status text not null check (verification_status in ('partner_reference', 'verified_official', 'needs_official_check', 'outdated')),
  confidential boolean not null default true check (confidential),
  encrypted_source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_review_queue (
  id uuid primary key default gen_random_uuid(),
  program_id text references public.programs(id) on delete cascade,
  review_type text not null check (review_type in ('source_conflict', 'outdated_source', 'institution_match', 'content_extraction')),
  summary text not null,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'resolved', 'dismissed')),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_programs_university_intake on public.programs(university_id, intake_year, intake_term);
create index idx_program_modules_program on public.program_course_modules(program_id, module_type, display_order);
create index idx_program_requirements_lookup on public.program_requirement_sets(program_id, applicant_country);
create index idx_private_institution_rules_lookup on private_institution_admission_rules(target_university_id, program_id, accepted_institution_id);

alter table public.programs enable row level security;
alter table public.program_content_profiles enable row level security;
alter table public.program_course_modules enable row level security;
alter table public.program_requirement_sets enable row level security;
alter table private_institution_admission_rules enable row level security;
alter table public.knowledge_review_queue enable row level security;

comment on table private_institution_admission_rules is 'Confidential partner admission rules. No browser-facing select policy is permitted.';


-- Official-source ingestion and field-level provenance.
create table public.program_sources (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.programs(id) on delete cascade,
  source_url text not null,
  source_type text not null check (source_type in ('program_page', 'curriculum_page', 'module_catalogue', 'programme_specification_pdf', 'careers_page')),
  official_domain text not null,
  discovery_method text not null check (discovery_method in ('registered', 'sitemap', 'official_search', 'linked_document')),
  extraction_method text check (extraction_method in ('json_ld', 'static_html', 'browser_rendered', 'pdf', 'manual')),
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  robots_checked_at timestamptz,
  last_retrieved_at timestamptz,
  content_hash text,
  verified_content_hash text,
  status text not null default 'active' check (status in ('active', 'blocked', 'login_required', 'invalid', 'outdated')),
  unique (program_id, source_url)
);

create table public.program_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  program_source_id uuid not null references public.program_sources(id) on delete cascade,
  content_hash text not null,
  storage_reference text,
  page_title text,
  retrieved_at timestamptz not null,
  http_status int,
  change_status text not null default 'unchanged' check (change_status in ('new', 'unchanged', 'changed', 'removed')),
  unique (program_source_id, content_hash)
);

create table public.extracted_program_fields (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.programs(id) on delete cascade,
  field_name text not null check (field_name in ('introduction', 'learning_focus', 'core_module', 'optional_module', 'learning_outcome', 'practical_component', 'career_direction', 'target_students', 'duration', 'teaching_location', 'teaching_format', 'accreditation')),
  field_value text not null,
  source_url text not null,
  source_page_title text not null,
  source_text text,
  retrieved_at timestamptz not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  verification_status text not null check (verification_status in ('verified', 'needs_review', 'outdated')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.program_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.programs(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'discovering', 'fetching', 'extracting', 'validating', 'needs_review', 'published', 'failed')),
  trigger text not null check (trigger in ('preload', 'on_demand', 'scheduled_refresh', 'manual_retry')),
  priority int not null default 50 check (priority between 0 and 100),
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_program_sources_program on public.program_sources(program_id, status);
create index idx_program_fields_program on public.extracted_program_fields(program_id, field_name, verification_status);
create index idx_ingestion_jobs_queue on public.program_ingestion_jobs(status, priority desc, created_at);

alter table public.program_sources enable row level security;
alter table public.program_source_snapshots enable row level security;
alter table public.extracted_program_fields enable row level security;
alter table public.program_ingestion_jobs enable row level security;

comment on table public.extracted_program_fields is 'Field-level official evidence. Source text remains internal and must not be returned by public APIs.';
comment on table public.program_source_snapshots is 'Internal change-detection metadata; raw snapshots belong in private object storage.';


-- Confidential workbook imports. These tables intentionally have no browser-facing policies.
create table private_admission_import_jobs (
  id uuid primary key default gen_random_uuid(),
  source_name_hash text not null,
  source_hash text not null,
  sheet_count int not null,
  imported_rule_count int not null default 0,
  review_issue_count int not null default 0,
  skipped_sheet_count int not null default 0,
  status text not null check (status in ('running', 'needs_review', 'completed', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table private_admission_import_issues (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references private_admission_import_jobs(id) on delete cascade,
  sheet_name_hash text not null,
  row_number int,
  issue_code text not null check (issue_code in ('parser_missing', 'unresolved_university', 'ambiguous_rule', 'invalid_average', 'conflicting_rows')),
  summary text not null,
  evidence_fingerprint text,
  created_at timestamptz not null default now()
);

alter table private_institution_admission_rules
  add column import_job_id uuid references private_admission_import_jobs(id) on delete set null;

create index idx_private_import_jobs_source on private_admission_import_jobs(source_hash, created_at desc);
create index idx_private_import_issues_job on private_admission_import_issues(import_job_id, issue_code);

alter table private_admission_import_jobs enable row level security;
alter table private_admission_import_issues enable row level security;

comment on table private_admission_import_jobs is 'Confidential source imports; source names are hashed and no browser policy is allowed.';
comment on table private_admission_import_issues is 'Knowledge Ops review issues from confidential imports; no browser policy is allowed.';


create or replace function public.claim_program_ingestion_job()
returns table(job_id uuid, program_id text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select jobs.id
    from public.program_ingestion_jobs jobs
    where jobs.status = 'queued'
    order by jobs.priority desc, jobs.created_at
    for update skip locked
    limit 1
  )
  update public.program_ingestion_jobs jobs
  set status = 'discovering',
      attempts = jobs.attempts + 1,
      locked_at = now(),
      updated_at = now()
  from candidate
  where jobs.id = candidate.id
  returning jobs.id, jobs.program_id;
end;
$$;

revoke all on function public.claim_program_ingestion_job() from public, anon, authenticated;
grant execute on function public.claim_program_ingestion_job() to service_role;
