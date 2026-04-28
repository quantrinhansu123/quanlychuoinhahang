alter table public.dashboard_tasks
  add column if not exists video_url text;

drop policy if exists "public update dashboard tasks" on public.dashboard_tasks;
create policy "public update dashboard tasks"
  on public.dashboard_tasks
  for update
  to anon, authenticated
  using (true)
  with check (true);
