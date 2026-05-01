drop policy if exists "public insert dashboard tasks" on public.dashboard_tasks;
create policy "public insert dashboard tasks"
  on public.dashboard_tasks
  for insert
  to anon, authenticated
  with check (true);
