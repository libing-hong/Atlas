-- Atlas Private Beta: account provisioning, canonical cloud state, review queue and deletion.

create or replace function public.handle_new_atlas_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users(auth_user_id, role, name, email)
  values (
    new.id,
    'student',
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, 'Atlas user'), '@', 1)),
    new.email
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_atlas_user on auth.users;
create trigger on_auth_user_created_create_atlas_user
after insert or update of email on auth.users
for each row execute function public.handle_new_atlas_auth_user();

insert into public.users(auth_user_id, role, name, email)
select au.id, 'student', coalesce(nullif(au.raw_user_meta_data ->> 'name', ''), split_part(coalesce(au.email, 'Atlas user'), '@', 1)), au.email
from auth.users au
where not exists (select 1 from public.users u where u.auth_user_id = au.id);

create table if not exists public.atlas_user_states (
  owner_user_id uuid primary key references public.users(id) on delete cascade,
  state_version integer not null default 1,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.atlas_user_states enable row level security;
drop policy if exists atlas_user_states_owner_scope on public.atlas_user_states;
create policy atlas_user_states_owner_scope on public.atlas_user_states for all
  using (owner_user_id = public.current_atlas_user_id())
  with check (owner_user_id = public.current_atlas_user_id());

create table if not exists public.review_queue (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete set null,
  module text not null,
  input_summary text,
  error_type text not null,
  status text not null default 'pending' check (status in ('pending','in_review','resolved','dismissed')),
  resolution_note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.review_queue enable row level security;
drop policy if exists review_queue_admin_scope on public.review_queue;
create policy review_queue_admin_scope on public.review_queue for all
  using (public.current_atlas_role() = 'admin')
  with check (public.current_atlas_role() = 'admin');
drop policy if exists review_queue_owner_create on public.review_queue;
create policy review_queue_owner_create on public.review_queue for insert
  with check (owner_user_id = public.current_atlas_user_id());

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  module text not null,
  success boolean,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.product_events enable row level security;
drop policy if exists product_events_owner_create on public.product_events;
create policy product_events_owner_create on public.product_events for insert
  with check (owner_user_id = public.current_atlas_user_id());
drop policy if exists product_events_admin_read on public.product_events;
create policy product_events_admin_read on public.product_events for select
  using (public.current_atlas_role() = 'admin');

alter table public.application_records drop constraint if exists application_records_status_check;
alter table public.application_records
  add constraint application_records_status_check check(status in (
    'considering','selected','preparing_materials','ready_to_submit','submitted',
    'waiting_result','supplement_required','rejected','conditional_offer',
    'unconditional_offer','accepted','declined','withdrawn'
  )) not valid;

create or replace function public.delete_my_atlas_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_auth_user uuid := auth.uid();
begin
  if target_auth_user is null then
    raise exception 'Authentication required';
  end if;
  delete from public.users where auth_user_id = target_auth_user;
  delete from auth.users where id = target_auth_user;
end;
$$;

revoke all on function public.delete_my_atlas_account() from public, anon;
grant execute on function public.delete_my_atlas_account() to authenticated;


