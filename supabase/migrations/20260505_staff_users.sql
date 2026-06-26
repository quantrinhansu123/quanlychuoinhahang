-- Staff / users: name, branch, role, phone, password (bcrypt hash)

alter table public.staff_members
  add column if not exists branch_name text not null default 'Main branch',
  add column if not exists phone text,
  add column if not exists password_hash text;

create index if not exists idx_staff_members_branch
  on public.staff_members(branch_name);

-- pgcrypto: on Supabase, crypt/gen_salt live in the extensions schema
create extension if not exists pgcrypto with schema extensions;

-- Hash password server-side (never store plain text)
create or replace function public.hash_password(plain_password text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select case
    when plain_password is null or btrim(plain_password) = '' then null
    else extensions.crypt(btrim(plain_password), extensions.gen_salt('bf'))
  end;
$$;

grant execute on function public.hash_password(text) to anon, authenticated;

comment on column public.staff_members.password_hash is 'bcrypt hash via hash_password(). Leave empty in UI to keep existing password.';

-- Backfill branch for existing rows
update public.staff_members
set branch_name = 'Main branch'
where branch_name is null or btrim(branch_name) = '';
