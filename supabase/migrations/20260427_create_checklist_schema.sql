-- Create extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'category_color') then
    create type public.category_color as enum ('primary', 'secondary', 'tertiary');
  end if;

  if not exists (select 1 from pg_type where typname = 'team_shift') then
    create type public.team_shift as enum ('opening', 'closing');
  end if;
end $$;

-- Dashboard categories (JUICE, SWEET, DINE-IN)
create table if not exists public.dashboard_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  icon_name text not null,
  color public.category_color not null,
  sort_order integer not null default 0,
  sub_header text,
  created_at timestamptz not null default now()
);

-- Tasks shown inside each dashboard category
create table if not exists public.dashboard_tasks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.dashboard_categories(id) on delete cascade,
  task_name text not null,
  image_url text not null,
  urgent_text text,
  info_text text,
  is_special boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dashboard_tasks_category_name_unique'
  ) then
    alter table public.dashboard_tasks
      add constraint dashboard_tasks_category_name_unique unique (category_id, task_name);
  end if;
end $$;

create index if not exists idx_dashboard_tasks_category_sort
  on public.dashboard_tasks(category_id, sort_order);

-- Checklist templates used in Operations > Checklist work
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  shift public.team_shift not null,
  task_label text not null,
  icon_name text,
  color_class text,
  bg_class text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'checklist_templates_shift_label_unique'
  ) then
    alter table public.checklist_templates
      add constraint checklist_templates_shift_label_unique unique (shift, task_label);
  end if;
end $$;

create index if not exists idx_checklist_templates_shift_sort
  on public.checklist_templates(shift, sort_order);

-- Completed checklist entries used in Operations > Checklist DONE
create table if not exists public.checklist_completions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.checklist_templates(id) on delete set null,
  shift public.team_shift not null,
  task_label text not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_checklist_completions_shift_completed_at
  on public.checklist_completions(shift, completed_at desc);

-- Helpful view for UI reads
create or replace view public.v_checklist_done as
select
  id,
  shift,
  task_label,
  completed_at,
  to_char(completed_at, 'DD Mon YYYY') as completed_date,
  to_char(completed_at, 'HH24:MI') as completed_time
from public.checklist_completions
order by completed_at desc;

-- Row Level Security
alter table public.dashboard_categories enable row level security;
alter table public.dashboard_tasks enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_completions enable row level security;

-- Demo-friendly policies (public read/write with anon key)
drop policy if exists "public read dashboard categories" on public.dashboard_categories;
create policy "public read dashboard categories"
  on public.dashboard_categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read dashboard tasks" on public.dashboard_tasks;
create policy "public read dashboard tasks"
  on public.dashboard_tasks
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read checklist templates" on public.checklist_templates;
create policy "public read checklist templates"
  on public.checklist_templates
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read checklist completions" on public.checklist_completions;
create policy "public read checklist completions"
  on public.checklist_completions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public write checklist completions" on public.checklist_completions;
create policy "public write checklist completions"
  on public.checklist_completions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public delete checklist completions" on public.checklist_completions;
create policy "public delete checklist completions"
  on public.checklist_completions
  for delete
  to anon, authenticated
  using (true);

-- Seed categories
insert into public.dashboard_categories (slug, title, icon_name, color, sort_order, sub_header)
values
  ('juice', 'JUICE', 'Leaf', 'primary', 1, null),
  ('sweet', 'SWEET', 'Cake', 'secondary', 2, null),
  ('dine', 'DINE-IN', 'Utensils', 'tertiary', 3, 'Equipment Checks')
on conflict (slug) do update
set
  title = excluded.title,
  icon_name = excluded.icon_name,
  color = excluded.color,
  sort_order = excluded.sort_order,
  sub_header = excluded.sub_header;

-- Seed dashboard tasks (representative data from current UI)
with cat as (
  select id, slug from public.dashboard_categories
)
insert into public.dashboard_tasks (
  category_id, task_name, image_url, urgent_text, info_text, is_special, sort_order
)
values
  ((select id from cat where slug = 'juice'), 'Avocado Juice', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQWxNzQllOAsUNnTA2V-Izmr4YhiWOWtlsqFsnSxVrqfPEU9y66cE__TomW0uXiynio_137GhlWd63ebhCiAFab61AE13P5Axg0f-aDxVb7X8AVd_KcxsaS4ry8EvryFsU-j9fPwAT8lVJRx91uid2JaydBX2bH-har6VzZyKGqPtiPIazKH5g7e7sf89vO8GyifdRjC3htPYR7C7WrVh4cNMjlINo9i1CC0a0_dK7nwC0V-vQmvO8QnVdgZICWp6eSEiAVVjhpw', null, null, false, 1),
  ((select id from cat where slug = 'juice'), 'Mango Juice', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXBcbie7ne7fFsdNNqyHvoLwPyaKdVmIj2-NYhTUO-62N1FNWLrlrLkw63u2U9JErAE8ao7TuLF4u-RQtTLcfz68XtquZdjtq7k3-DTBE5qwRUrxVseBa2j85NpAmVSMajb2sPORDuQHe7ZLW3LUsEHBO3sE6BB0hFGW6AyyCeTsf1VI9_KQcWBGNwAJdGo1dFOyoYdloGJjNfUOc_06yoMxlknhh21TR_U1SREBa9-N5mT-1CxMg4HD1Ir8hPmmGyw2Lue_TSfA', null, null, false, 2),
  ((select id from cat where slug = 'sweet'), 'Pancake mix', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrCv-1AsaQ2-JST7jHj9DsmtoYp5ppQzky1TyWEQ3JHpQvNnBhtWqfUhzbwvKsuMQLo5YS6_CwT4BmkmN8QH-ZEUDx5gvJ3hFqkMqHqp3c1pgq4W6C21T3vlEnCihSV4IkbkASJk7fqKOI0n2cyD87M-USu-clGHl6adQjj18r6gERNig2oRUcFPRPqRs1O5WywKK5cNke-VWibyPHH7qfNdVa-ENPdyquXfR1YdO_APxBbmVtJ4fKDN7hVZuHxbx1PXRtMABM0Q', null, null, false, 1),
  ((select id from cat where slug = 'sweet'), 'Ice Cream', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ539kmSrRwAnEsdssNqyDHWrujyvpVLHCCh-pmHcOTF_Ge2P-2W-pUpGQ0fFQOG0J9_dB3VpcAzQ9S6CbbepuE-qkUJy2NBy4o3bxlv9jIBCFILawI2300XTSGASZTrST0LiagNvq0nUtCDNK5RjQv6LJLtkZIV9lj7wwPfNxHNpo5QiTXiWVgRdQfuhIky5GDxYORcEOmtp1PjpBA_1saTRlC4ac4nVh_TJIkyqLayY-r1M0hzpi26RToiiDv99ATlZlAecJQA', null, null, false, 6),
  ((select id from cat where slug = 'dine'), 'Drink water, please!!!', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlnanJDzczek8_DJOc3Z50NGBXjpAg3me1X5FfWC-ywkDDSn0xuktgI7jDdjKd4t17mhbABEDPI8rAmm-iTeI39DfukHVDN9Hyi_F9NYpoTXl-XRzYom6YGDSTM65HX-Abltzlb0m9ecHHtnsY0Ew9PpDSOcFw7aoxDzvshE3CfVMTaE58By64FVH7TT-McEYKAgM6mS6BlxNx5GCxxDvPezpUc88wB--W1Ph0u6N7WvGdK21yfiLbknx8kDWyXcRydv3FIjPXlQ', null, null, false, 1),
  ((select id from cat where slug = 'dine'), 'Coffee Machine Water', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgBaT-U9hw_Tz_Cfsb3iQPwEM0BZRymb7q44Jv1v7BMXOvPQ0STlR5HoYgqko3ENoz98w4CpOEY63sA2WmwyPDXbtA7fJPVA7KWrBXmKf4D2vPzDsJOfZKVB3RJ9hukw5ellY2rvrJQqFetrk3X_NR_ezE-8WwLqWJfOYu-nA8n6071kfFQKg5Xcg7DGeUzGpQ5Jcqp5WlKwWjiWv2XdXLmKMQaka-uTd6qsA6dz1Yg5KjdOrkWN3Lx15IIB4qByOK9ASBaw-9Qg', 'Urgent Refill', null, true, 101),
  ((select id from cat where slug = 'dine'), 'Refill Choc Fountains', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAycMVLrkM3rkfXXIbL_E2Dgb1vZhyMyO5CWwhDhSxuflt2bwkETItD2HNMCgqrk3zLG-gIooOCFzkyb0E_krxAhrn01YlGiJKUTxPhZUzax0V8o-_cls9bOPNWAZ0EQqaDWUcQFC57FCNo9ePfhAjaz1uVBle7ruscXBb3XQSS9x0s-IlpTDR44F9bbH7_i16c_weBtPoOLZRvYlJ7ElVY8IXefAH97805Uus_lWh2HGl_-rjWw44EoQCBWggYvlsc3fc0vau2Yg', null, 'Temp: 45°C', true, 102)
on conflict (category_id, task_name) do update
set
  image_url = excluded.image_url,
  urgent_text = excluded.urgent_text,
  info_text = excluded.info_text,
  is_special = excluded.is_special,
  sort_order = excluded.sort_order;

-- Seed operation checklist templates
insert into public.checklist_templates (shift, task_label, icon_name, color_class, bg_class, sort_order)
values
  ('closing', 'Sanitize all prep surfaces and stations', 'Sparkles', 'text-purple-600', 'bg-purple-100', 1),
  ('closing', 'Secure all dry storage and cold rooms', 'ShieldCheck', 'text-purple-600', 'bg-purple-100', 2),
  ('closing', 'Complete evening inventory waste log', 'Box', 'text-purple-600', 'bg-purple-100', 3),
  ('opening', 'Check refrigerator & freezer temperatures', 'Thermometer', 'text-pink-600', 'bg-pink-100', 1),
  ('opening', 'Review deliveries and invoice validation', 'FileText', 'text-pink-600', 'bg-pink-100', 2)
on conflict (shift, task_label) do update
set
  icon_name = excluded.icon_name,
  color_class = excluded.color_class,
  bg_class = excluded.bg_class,
  sort_order = excluded.sort_order,
  is_active = true;

-- Seed operation done history
insert into public.checklist_completions (shift, task_label, completed_at)
select *
from (
  values
    ('closing'::public.team_shift, 'Empty grease traps & oil disposal', now() - interval '1 day' + interval '22 hours 45 minutes'),
    ('closing'::public.team_shift, 'Dishwasher cycle finish & drain', now() - interval '1 day' + interval '23 hours 15 minutes'),
    ('opening'::public.team_shift, 'Unlock staff entry & clock-in', now() + interval '5 hours 30 minutes'),
    ('opening'::public.team_shift, 'Coffee machine calibration & purge', now() + interval '6 hours')
) as seed(shift, task_label, completed_at)
where not exists (select 1 from public.checklist_completions);
