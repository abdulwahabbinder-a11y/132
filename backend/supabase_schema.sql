create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  stripe_customer_id text unique,
  preferred_script_language text not null default 'en',
  video_credits_left integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('free', 'pro')),
  stripe_customer_id text not null,
  video_credits_left integer not null default 30,
  billing_cycle_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null,
  script_language text not null default 'en',
  scenes_json jsonb not null,
  status text not null default 'queued',
  result_json jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_status on public.projects(user_id, status);
