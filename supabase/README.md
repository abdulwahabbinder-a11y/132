# Supabase schema

This directory holds the SQL migrations for DocuForge AI.

## Tables

- **`users`** — public profile, keyed by `auth.users.id`.
- **`subscriptions`** — `plan_type`, `stripe_customer_id`, `video_credits_left`,
  `billing_cycle_end` (plus `stripe_subscription_id` for portal/cancellation).
- **`videos`** — one row per generation request (status + progress + output URL).
- **`scenes`** — the chronological scene breakdown produced by the scripting router.

## Key behaviours

- A trigger on `auth.users` auto-creates a profile + a **free** subscription with
  **3 credits** on sign-up.
- `decrement_video_credit(p_user_id)` atomically spends one credit and returns the
  new balance (used by the `/api/generate-story` credit gate).
- The Stripe webhook (`customer.subscription.created`) upgrades the user to **pro**
  and **resets `video_credits_left` to 30**.
- Row Level Security restricts reads to the owning user; the backend performs
  privileged writes with the service-role key.

## Applying

Using the Supabase CLI:

```bash
supabase db push        # or: supabase migration up
```

Or paste `migrations/0001_init.sql` into the Supabase SQL editor.
