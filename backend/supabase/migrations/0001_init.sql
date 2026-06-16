-- ============================================================================
-- DocuForge AI — initial schema
-- Run via: supabase db push   (or paste into the Supabase SQL editor)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- users : application profile mirroring auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.users (
    id              uuid primary key references auth.users (id) on delete cascade,
    email           text unique not null,
    full_name       text,
    avatar_url      text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- subscriptions : one active subscription per user
-- ----------------------------------------------------------------------------
create type plan_type as enum ('free', 'pro');

create table if not exists public.subscriptions (
    id                   uuid primary key default uuid_generate_v4(),
    user_id              uuid not null references public.users (id) on delete cascade,
    plan_type            plan_type not null default 'free',
    stripe_customer_id   text,
    stripe_subscription_id text,
    video_credits_left   integer not null default 3,
    billing_cycle_end    timestamptz,
    status               text not null default 'active',
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    unique (user_id)
);

create index if not exists idx_subscriptions_stripe_customer
    on public.subscriptions (stripe_customer_id);

-- ----------------------------------------------------------------------------
-- video_jobs : a documentary generation request + lifecycle
-- ----------------------------------------------------------------------------
create type job_status as enum (
    'pending', 'scripting', 'scraping', 'voicing',
    'animating', 'assembling', 'rendering', 'completed', 'failed'
);

create table if not exists public.video_jobs (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.users (id) on delete cascade,
    topic           text not null,
    language        text not null default 'english',
    status          job_status not null default 'pending',
    progress        integer not null default 0,           -- 0..100
    script          jsonb,                                 -- chronological scene list
    assets          jsonb,                                 -- scraped/generated media manifest
    output_url      text,                                  -- final 21:9 MP4
    error_message   text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_video_jobs_user on public.video_jobs (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_users_updated      before update on public.users          for each row execute function public.set_updated_at();
create trigger trg_subs_updated       before update on public.subscriptions  for each row execute function public.set_updated_at();
create trigger trg_jobs_updated       before update on public.video_jobs      for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- New-user bootstrap: create profile + free subscription on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;

    insert into public.subscriptions (user_id, plan_type, video_credits_left)
    values (new.id, 'free', 3)
    on conflict (user_id) do nothing;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_jobs    enable row level security;

create policy "Users read own profile"
    on public.users for select using (auth.uid() = id);
create policy "Users update own profile"
    on public.users for update using (auth.uid() = id);

create policy "Users read own subscription"
    on public.subscriptions for select using (auth.uid() = user_id);

create policy "Users read own jobs"
    on public.video_jobs for select using (auth.uid() = user_id);
create policy "Users insert own jobs"
    on public.video_jobs for insert with check (auth.uid() = user_id);
