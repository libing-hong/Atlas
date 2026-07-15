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
  coverage_status text not null check (coverage_status in ('verified', 'partially_verified', 'fetching', 'manual_review', 'not_available')),
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
