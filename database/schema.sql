create extension if not exists "pgcrypto";

create type task_status as enum ('todo', 'in_progress', 'completed');
create type task_priority as enum ('low', 'medium', 'high');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '',
  status task_status not null default 'todo',
  due_date date not null,
  priority task_priority not null default 'medium',
  owner text not null default 'Ops',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "service role can manage tasks" on public.tasks;
create policy "service role can manage tasks"
on public.tasks
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
