-- Per-branch branding and parameters (Settings page)
create table if not exists public.branch_settings (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null,
  logo_url text not null default '',
  video_url text not null default '',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branch_settings_branch_name_key unique (branch_name)
);

create index if not exists idx_branch_settings_sort
  on public.branch_settings(sort_order);

alter table public.branch_settings enable row level security;

drop policy if exists "public read branch settings" on public.branch_settings;
create policy "public read branch settings"
  on public.branch_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert branch settings" on public.branch_settings;
create policy "public insert branch settings"
  on public.branch_settings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public update branch settings" on public.branch_settings;
create policy "public update branch settings"
  on public.branch_settings
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public delete branch settings" on public.branch_settings;
create policy "public delete branch settings"
  on public.branch_settings
  for delete
  to anon, authenticated
  using (true);

insert into public.branch_settings (branch_name, logo_url, video_url, sort_order, notes)
values (
  'Main branch',
  '',
  '',
  0,
  'Default branch — set logo URL, video URL, and notes per location.'
)
on conflict (branch_name) do nothing;
