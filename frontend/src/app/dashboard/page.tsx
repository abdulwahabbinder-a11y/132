import Link from "next/link";
import { CreditCard, ShieldCheck, WandSparkles } from "lucide-react";

import type { DashboardPayload } from "@/lib/api";
import { clientEnv } from "@/lib/env";
import { GenerateStoryForm } from "@/components/dashboard/generate-story-form";
import { ProjectList } from "@/components/dashboard/project-list";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

async function fetchDashboard(accessToken: string): Promise<DashboardPayload> {
  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as DashboardPayload;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const accessToken = session?.access_token;

  if (!supabase || !accessToken) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-20 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
            <ShieldCheck className="h-4 w-4" />
            Supabase authentication required
          </div>
          <h1 className="text-4xl font-semibold text-white">Connect auth to unlock the production dashboard.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            This scaffold expects a Supabase session and forwards its access token to the FastAPI
            backend for credit checks and project ownership. Add your Supabase keys and sign-in UI
            to activate authenticated generation.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Back to landing page
            </Link>
            <a
              href={clientEnv.NEXT_PUBLIC_STRIPE_PRO_PLAN_URL || "#pricing"}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-sky-300 hover:text-sky-200"
            >
              Review Pro plan
            </a>
          </div>
        </div>
      </main>
    );
  }

  const dashboard = await fetchDashboard(accessToken);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-14 lg:px-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-sky-200">
            <WandSparkles className="h-4 w-4" />
            Production control room
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Welcome back, {dashboard.user.email}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Generate premium documentary scripts, trigger the multi-source asset worker, and track
            renders from one dashboard.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-full bg-sky-400/10 p-2 text-sky-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Current plan</div>
            <div className="mt-2 text-2xl font-semibold text-white">{dashboard.user.plan_type}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-full bg-sky-400/10 p-2 text-sky-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Credits left</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {dashboard.user.video_credits_left}
            </div>
          </div>
        </div>
      </div>

      <GenerateStoryForm accessToken={accessToken} />
      <ProjectList projects={dashboard.recent_projects} />
    </main>
  );
}
