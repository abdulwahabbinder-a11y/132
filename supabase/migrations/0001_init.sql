-- ============================================================================
-- DocuForge AI — initial schema
-- Tables: users (public profile), subscriptions, videos, scenes
-- Includes Row Level Security and an atomic credit-decrement RPC.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users (public profile mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text not null,
    full_name   text,
    avatar_url  text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create type plan_type as enum ('free', 'pro');

create table if not exists public.subscriptions (
    id                    uuid primary key default uuid_generate_v4(),
    user_id               uuid not null unique references public.users (id) on delete cascade,
    plan_type             plan_type not null default 'free',
    stripe_customer_id    text,
    stripe_subscription_id text,
    video_credits_left    integer not null default 3,
    billing_cycle_end     timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions (user_id);
create index if not exists idx_subscriptions_customer on public.subscriptions (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references public.users (id) on delete cascade,
    topic       text not null,
    language    text not null default 'english',
    status      text not null default 'queued',
    progress    integer not null default 0,
    output_url  text,
    error       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index if not exists idx_videos_user on public.videos (user_id);

-- ---------------------------------------------------------------------------
-- scenes
-- ---------------------------------------------------------------------------
create table if not exists public.scenes (
    id                      uuid primary key default uuid_generate_v4(),
    video_id                uuid not null references public.videos (id) on delete cascade,
    scene_number            integer not null,
    narration_text          text not null,
    visual_keywords         jsonb not null default '[]'::jsonb,
    is_abstract_scene       boolean not null default false,
    is_historical_character boolean not null default false,
    character_name          text,
    location_coordinates    jsonb,
    audio_url               text,
    clip_url                text,
    media_assets            jsonb not null default '[]'::jsonb,
    word_timestamps         jsonb not null default '[]'::jsonb,
    created_at              timestamptz not null default now(),
    unique (video_id, scene_number)
);

create index if not exists idx_scenes_video on public.scenes (video_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_users_updated     before update on public.users         for each row execute function public.set_updated_at();
create trigger trg_subs_updated      before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger trg_videos_updated    before update on public.videos        for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-provision profile + free subscription when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;

    insert into public.subscriptions (user_id, plan_type, video_credits_left, billing_cycle_end)
    values (new.id, 'free', 3, now() + interval '30 days')
    on conflict (user_id) do nothing;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic credit decrement (used by the SaaS engine credit gate)
-- ---------------------------------------------------------------------------
create or replace function public.decrement_video_credit(p_user_id uuid)
returns integer as $$
declare
    remaining integer;
begin
    update public.subscriptions
       set video_credits_left = greatest(video_credits_left - 1, 0)
     where user_id = p_user_id
       and video_credits_left > 0
    returning video_credits_left into remaining;

    if remaining is null then
        -- No row was updated (0 credits); return current balance (0 or actual).
        select video_credits_left into remaining
          from public.subscriptions where user_id = p_user_id;
    end if;

    return coalesce(remaining, 0);
end;
$$ language plpgsql security definer;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.videos        enable row level security;
alter table public.scenes        enable row level security;

-- users: a user can see/update only their own profile.
create policy "users_select_own" on public.users
    for select using (auth.uid() = id);
create policy "users_update_own" on public.users
    for update using (auth.uid() = id);

-- subscriptions: read-only to the owner (writes happen via service role).
create policy "subs_select_own" on public.subscriptions
    for select using (auth.uid() = user_id);

-- videos: full CRUD scoped to the owner.
create policy "videos_select_own" on public.videos
    for select using (auth.uid() = user_id);
create policy "videos_insert_own" on public.videos
    for insert with check (auth.uid() = user_id);
create policy "videos_update_own" on public.videos
    for update using (auth.uid() = user_id);

-- scenes: visible when the parent video belongs to the user.
create policy "scenes_select_own" on public.scenes
    for select using (
        exists (
            select 1 from public.videos v
            where v.id = scenes.video_id and v.user_id = auth.uid()
        )
    );

-- NOTE: the backend uses the service-role key for inserts/updates to videos,
-- scenes and subscriptions, which bypasses RLS by design.
