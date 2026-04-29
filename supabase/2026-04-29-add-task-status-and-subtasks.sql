alter table public.tasks
  add column status text not null default 'todo',
  add column subtasks jsonb not null default '[]'::jsonb;

update public.tasks
  set status = case when done then 'done' else 'todo' end;

alter table public.tasks
  add constraint tasks_status_check check (status in ('todo', 'in-progress', 'done'));

alter table public.tasks
  drop column done;