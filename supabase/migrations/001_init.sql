-- =============================================================================
-- AI Documentary Video Generator — Initial Schema
-- =============================================================================
-- Run via Supabase CLI:   supabase db push
-- Or paste into Supabase SQL editor.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
-- Mirrors auth.users (1:1) so we can attach app-specific columns.
-- -----------------------------------------------------------------------------
create table if not exists public.users (
    id              uuid primary key references auth.users(id) on delete cascade,
    email           text unique not null,
    full_name       text,
    avatar_url      text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
create type plan_type as enum ('free', 'pro');
create type subscription_status as enum (
    'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'
);

create table if not exists public.subscriptions (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null unique references public.users(id) on delete cascade,
    plan_type               plan_type not null default 'free',
    status                  subscription_status not null default 'active',
    stripe_customer_id      text unique,
    stripe_subscription_id  text unique,
    video_credits_left      integer not null default 3,
    billing_cycle_end       timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index if not exists idx_subscriptions_stripe_customer
    on public.subscriptions(stripe_customer_id);

-- -----------------------------------------------------------------------------
-- VIDEO PROJECTS
-- -----------------------------------------------------------------------------
create type video_status as enum (
    'queued', 'scripting', 'scraping', 'rendering', 'composing', 'completed', 'failed'
);

create table if not exists public.videos (
    id                 uuid primary key default uuid_generate_v4(),
    user_id            uuid not null references public.users(id) on delete cascade,
    topic              text not null,
    language           text not null default 'english',
    status             video_status not null default 'queued',
    progress_pct       integer not null default 0,
    script_json        jsonb,                -- LLM scene script
    assets_json        jsonb,                -- scraped/generated asset URLs per scene
    output_url         text,                 -- CDN URL to final MP4
    duration_seconds   integer,
    error_message      text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

create index if not exists idx_videos_user_id on public.videos(user_id);
create index if not exists idx_videos_status  on public.videos(status);

-- -----------------------------------------------------------------------------
-- TRIGGERS — keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_users_touch       on public.users;
drop trigger if exists trg_subs_touch        on public.subscriptions;
drop trigger if exists trg_videos_touch      on public.videos;

create trigger trg_users_touch  before update on public.users
    for each row execute procedure public.touch_updated_at();
create trigger trg_subs_touch   before update on public.subscriptions
    for each row execute procedure public.touch_updated_at();
create trigger trg_videos_touch before update on public.videos
    for each row execute procedure public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- AUTH BRIDGE — auto-create profile + free subscription on signup
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.users (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

    insert into public.subscriptions (user_id, plan_type, video_credits_left)
    values (new.id, 'free', 3);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.videos        enable row level security;

create policy "users_self_read"    on public.users
    for select using (auth.uid() = id);
create policy "users_self_update"  on public.users
    for update using (auth.uid() = id);

create policy "subs_self_read"     on public.subscriptions
    for select using (auth.uid() = user_id);

create policy "videos_self_read"   on public.videos
    for select using (auth.uid() = user_id);
create policy "videos_self_insert" on public.videos
    for insert with check (auth.uid() = user_id);
create policy "videos_self_update" on public.videos
    for update using (auth.uid() = user_id);
