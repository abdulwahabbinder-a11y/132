create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  preferred_language text not null default 'english',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  plan_type text not null default 'free',
  stripe_customer_id text unique,
  video_credits_left integer not null default 0,
  billing_cycle_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_type_check check (plan_type in ('free', 'pro'))
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null,
  language text not null,
  status text not null default 'queued',
  story_json jsonb not null,
  asset_manifest jsonb,
  subtitles_json jsonb,
  render_url text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_generation_jobs_user_created_at
  on public.generation_jobs (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.generation_jobs enable row level security;

create policy "users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "users can read own jobs"
  on public.generation_jobs for select
  using (auth.uid() = user_id);
