-- Staff evaluation: criteria (Settings), staff roster, and daily scores (Checkwork tab)

create table if not exists public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  max_score integer not null default 5,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint evaluation_criteria_label_key unique (label),
  constraint evaluation_criteria_max_score_range check (max_score >= 1 and max_score <= 10)
);

create index if not exists idx_evaluation_criteria_sort
  on public.evaluation_criteria(sort_order);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint staff_members_full_name_key unique (full_name)
);

create index if not exists idx_staff_members_sort
  on public.staff_members(sort_order);

create table if not exists public.staff_evaluations (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_members(id) on delete cascade,
  criterion_id uuid not null references public.evaluation_criteria(id) on delete cascade,
  score integer not null,
  evaluation_date date not null default current_date,
  evaluator_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_evaluations_score_range check (score >= 1),
  constraint staff_evaluations_staff_criterion_date_key unique (staff_id, criterion_id, evaluation_date)
);

create index if not exists idx_staff_evaluations_staff_date
  on public.staff_evaluations(staff_id, evaluation_date);

-- RLS (same open policy as other tables)
alter table public.evaluation_criteria enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_evaluations enable row level security;

drop policy if exists "public read evaluation criteria" on public.evaluation_criteria;
create policy "public read evaluation criteria"
  on public.evaluation_criteria for select to anon, authenticated using (true);

drop policy if exists "public insert evaluation criteria" on public.evaluation_criteria;
create policy "public insert evaluation criteria"
  on public.evaluation_criteria for insert to anon, authenticated with check (true);

drop policy if exists "public update evaluation criteria" on public.evaluation_criteria;
create policy "public update evaluation criteria"
  on public.evaluation_criteria for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete evaluation criteria" on public.evaluation_criteria;
create policy "public delete evaluation criteria"
  on public.evaluation_criteria for delete to anon, authenticated using (true);

drop policy if exists "public read staff members" on public.staff_members;
create policy "public read staff members"
  on public.staff_members for select to anon, authenticated using (true);

drop policy if exists "public insert staff members" on public.staff_members;
create policy "public insert staff members"
  on public.staff_members for insert to anon, authenticated with check (true);

drop policy if exists "public update staff members" on public.staff_members;
create policy "public update staff members"
  on public.staff_members for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete staff members" on public.staff_members;
create policy "public delete staff members"
  on public.staff_members for delete to anon, authenticated using (true);

drop policy if exists "public read staff evaluations" on public.staff_evaluations;
create policy "public read staff evaluations"
  on public.staff_evaluations for select to anon, authenticated using (true);

drop policy if exists "public insert staff evaluations" on public.staff_evaluations;
create policy "public insert staff evaluations"
  on public.staff_evaluations for insert to anon, authenticated with check (true);

drop policy if exists "public update staff evaluations" on public.staff_evaluations;
create policy "public update staff evaluations"
  on public.staff_evaluations for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete staff evaluations" on public.staff_evaluations;
create policy "public delete staff evaluations"
  on public.staff_evaluations for delete to anon, authenticated using (true);

-- Seed default criteria and sample staff
insert into public.evaluation_criteria (label, description, max_score, sort_order)
values
  ('Personal hygiene', 'Clean uniform, neat hair, light fragrance', 5, 0),
  ('Service attitude', 'Friendly and polite with guests and teammates', 5, 1),
  ('Job skills', 'Follows bar / service procedures correctly', 5, 2),
  ('Punctuality', 'On time for shift, no lateness', 5, 3),
  ('Teamwork', 'Supports coworkers, clear communication', 5, 4)
on conflict (label) do nothing;

insert into public.staff_members (full_name, role, sort_order)
values
  ('Sample staff 1', 'Barista', 0),
  ('Sample staff 2', 'Server', 1)
on conflict (full_name) do nothing;
