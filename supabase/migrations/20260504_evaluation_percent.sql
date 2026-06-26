-- Evaluation scores as percent (0–100) + manager confirmation per staff per day

alter table public.staff_evaluations
  drop constraint if exists staff_evaluations_score_range;

alter table public.staff_evaluations
  add constraint staff_evaluations_score_percent_range
  check (score >= 0 and score <= 100);

-- Convert legacy 1–5 scores to percent if any exist
update public.staff_evaluations
set score = score * 20
where score between 1 and 5;

create table if not exists public.staff_evaluation_manager (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  evaluation_date date not null default current_date,
  manager_percent integer not null default 0,
  manager_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_evaluation_manager_percent_range check (manager_percent >= 0 and manager_percent <= 100),
  constraint staff_evaluation_manager_staff_date_key unique (staff_id, evaluation_date)
);

create index if not exists idx_staff_evaluation_manager_date
  on public.staff_evaluation_manager(evaluation_date);

alter table public.staff_evaluation_manager enable row level security;

drop policy if exists "public read staff evaluation manager" on public.staff_evaluation_manager;
create policy "public read staff evaluation manager"
  on public.staff_evaluation_manager for select to anon, authenticated using (true);

drop policy if exists "public insert staff evaluation manager" on public.staff_evaluation_manager;
create policy "public insert staff evaluation manager"
  on public.staff_evaluation_manager for insert to anon, authenticated with check (true);

drop policy if exists "public update staff evaluation manager" on public.staff_evaluation_manager;
create policy "public update staff evaluation manager"
  on public.staff_evaluation_manager for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete staff evaluation manager" on public.staff_evaluation_manager;
create policy "public delete staff evaluation manager"
  on public.staff_evaluation_manager for delete to anon, authenticated using (true);
