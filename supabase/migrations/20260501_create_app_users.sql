-- App users: login username, password (bcrypt hash), responsible branch name.
-- Requires pgcrypto (enabled in 20260427 migration) for crypt() / gen_salt().
-- Store only bcrypt hashes in password_hash — never plain text.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  branch_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_branch_name
  on public.app_users(branch_name);

comment on table public.app_users is 'App users: username, bcrypt password_hash, branch_name.';
comment on column public.app_users.password_hash is 'bcrypt hash: crypt(plain_password, gen_salt(''bf'')). Never plain text.';

alter table public.app_users enable row level security;

drop policy if exists "public read app users" on public.app_users;
create policy "public read app users"
  on public.app_users
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert app users" on public.app_users;
create policy "public insert app users"
  on public.app_users
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public update app users" on public.app_users;
create policy "public update app users"
  on public.app_users
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public delete app users" on public.app_users;
create policy "public delete app users"
  on public.app_users
  for delete
  to anon, authenticated
  using (true);

-- Example user (change in production)
insert into public.app_users (username, password_hash, branch_name)
values (
  'demo',
  crypt('demo123', gen_salt('bf')),
  'Main branch'
)
on conflict (username) do nothing;
