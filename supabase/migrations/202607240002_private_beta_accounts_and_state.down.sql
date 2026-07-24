drop function if exists public.delete_my_atlas_account();
drop table if exists public.product_events;
drop table if exists public.review_queue;
drop table if exists public.atlas_user_states;
drop trigger if exists on_auth_user_created_create_atlas_user on auth.users;
drop function if exists public.handle_new_atlas_auth_user();


