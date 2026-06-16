-- DocuGen AI – initial schema
-- Run after Supabase project provisioning. Designed to live alongside the
-- managed `auth.users` table; the `users` table below mirrors auth.users.

create extension if not exists "pgcrypto";

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email varchar(320) not null unique,
    full_name varchar(255),
    avatar_url varchar(1024),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create type plan_type as enum ('free', 'pro');

create table if not exists subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references users(id) on delete cascade,
    plan_type plan_type not null default 'free',
    stripe_customer_id varchar(255) unique,
    stripe_subscription_id varchar(255) unique,
    video_credits_left integer not null default 3,
    billing_cycle_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create type job_status as enum (
    'queued', 'scripting', 'scraping', 'generating_voice',
    'character_render', 'assembling', 'encoding', 'completed', 'failed'
);

create table if not exists video_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    topic varchar(512) not null,
    language varchar(16) not null default 'en',
    status job_status not null default 'queued',
    story_json jsonb,
    asset_manifest jsonb,
    error_message text,
    output_url varchar(1024),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_video_jobs_user on video_jobs(user_id);
create index if not exists idx_video_jobs_status on video_jobs(status);

-- Mirror auth.users into our users table whenever a new auth user is created.
create or replace function public.handle_new_supabase_user()
returns trigger
language plpgsql security definer
as $$
begin
    insert into public.users (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    )
    on conflict (id) do nothing;

    insert into public.subscriptions (user_id, plan_type, video_credits_left)
    values (new.id, 'free', 3)
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_supabase_user();
