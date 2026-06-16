# DocuForge AI — Frontend (Next.js + Tailwind)

Marketing site + authenticated studio dashboard for DocuForge AI.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (custom dark cinematic theme)
- Framer Motion for entrance/transition animation
- Supabase JS for auth + session
- Stripe.js for Pro checkout

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing: hero, feature grid, pricing |
| `/pricing` | Pricing section (Free $0 / Pro $29) → Stripe Checkout |
| `/login` | Supabase email/password auth |
| `/dashboard` | Generate documentaries, live job progress, credit balance |

## Components

- `components/PricingSection.tsx` — Free/Pro cards wired to `/api/billing/checkout`
- `components/dashboard/GenerateForm.tsx` — topic + language → `/api/generate-story`
- `components/dashboard/JobList.tsx` / `JobCard.tsx` — live polling of render progress
- `components/dashboard/CreditBadge.tsx` — remaining credits + plan

## Run

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_* vars
npm run dev                         # http://localhost:3000
```

The UI degrades gracefully: without Supabase env vars it shows a demo/auth-gate
state; pricing falls back to a static catalogue if the API is unreachable.
