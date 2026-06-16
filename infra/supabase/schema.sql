create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro')),
  stripe_customer_id text unique,
  video_credits_left integer not null default 1 check (video_credits_left >= 0),
  billing_cycle_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null,
  language text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  story_json jsonb not null default '[]'::jsonb,
  render_manifest jsonb,
  final_video_path text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists video_generations_user_idx on public.video_generations(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

drop trigger if exists video_generations_set_updated_at on public.video_generations;
create trigger video_generations_set_updated_at
before update on public.video_generations
for each row execute procedure public.set_updated_at();

create or replace function public.decrement_video_credit(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  update public.subscriptions
  set video_credits_left = video_credits_left - 1
  where user_id = target_user_id
    and video_credits_left > 0
  returning video_credits_left into remaining;

  if remaining is null then
    raise exception 'No video credits left' using errcode = 'P0001';
  end if;

  return remaining;
end;
$$;

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_generations enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own generations" on public.video_generations;
create policy "Users can read own generations"
on public.video_generations for select
using (auth.uid() = user_id);
