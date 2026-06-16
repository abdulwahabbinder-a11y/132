create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  video_credits_left integer not null default 3 check (video_credits_left >= 0),
  billing_cycle_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null,
  language text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'rendering', 'completed', 'failed')),
  story_json jsonb not null default '[]'::jsonb,
  asset_manifest jsonb not null default '{}'::jsonb,
  render_payload jsonb not null default '{}'::jsonb,
  final_video_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_jobs enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can read own video jobs"
  on public.video_jobs for select
  using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_subscriptions_updated_at on public.subscriptions;
create trigger touch_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_video_jobs_updated_at on public.video_jobs;
create trigger touch_video_jobs_updated_at
  before update on public.video_jobs
  for each row execute function public.touch_updated_at();
