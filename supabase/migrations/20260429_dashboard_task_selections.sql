-- Persist green "selected" state for dashboard task cards across reloads
create table if not exists public.dashboard_task_selections (
  task_id uuid primary key references public.dashboard_tasks(id) on delete cascade,
  selected_at timestamptz not null default now()
);

create index if not exists idx_dashboard_task_selections_selected_at
  on public.dashboard_task_selections(selected_at desc);

alter table public.dashboard_task_selections enable row level security;

drop policy if exists "public read dashboard task selections" on public.dashboard_task_selections;
create policy "public read dashboard task selections"
  on public.dashboard_task_selections
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert dashboard task selections" on public.dashboard_task_selections;
create policy "public insert dashboard task selections"
  on public.dashboard_task_selections
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public delete dashboard task selections" on public.dashboard_task_selections;
create policy "public delete dashboard task selections"
  on public.dashboard_task_selections
  for delete
  to anon, authenticated
  using (true);
