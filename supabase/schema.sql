create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.workspaces enable row level security;

drop policy if exists "Usuarios leem o proprio workspace" on public.workspaces;
create policy "Usuarios leem o proprio workspace"
on public.workspaces for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Usuarios criam o proprio workspace" on public.workspaces;
create policy "Usuarios criam o proprio workspace"
on public.workspaces for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuarios atualizam o proprio workspace" on public.workspaces;
create policy "Usuarios atualizam o proprio workspace"
on public.workspaces for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
