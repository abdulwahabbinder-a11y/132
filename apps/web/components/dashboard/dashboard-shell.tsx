"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { fetchJobs, fetchSubscription, generateStory } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { GeneratorForm } from "@/components/dashboard/generator-form";
import { JobsPanel } from "@/components/dashboard/jobs-panel";
import { PlanSummary } from "@/components/dashboard/plan-summary";
import type { JobResponse, StoryGenerationResponse, SubscriptionSummary } from "@/lib/types";

type UserState = {
  email: string | null;
  accessToken: string | null;
};

function useAuthState() {
  const [state, setState] = useState<UserState>({ email: null, accessToken: null });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth
      .getSession()
      .then((result: { data: { session: Session | null } }) => {
      setState({
        email: result.data.session?.user.email ?? null,
        accessToken: result.data.session?.access_token ?? null,
      });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setState({
        email: session?.user.email ?? null,
        accessToken: session?.access_token ?? null,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export function DashboardShell() {
  const { email, accessToken } = useAuthState();
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkState, setMagicLinkState] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!accessToken) {
      setSubscription(null);
      setJobs([]);
      return;
    }

    setLoading(true);
    Promise.all([fetchSubscription(accessToken), fetchJobs(accessToken)])
      .then(([subscriptionResult, jobsResult]) => {
        setSubscription(subscriptionResult);
        setJobs(jobsResult);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const onGenerate = async (payload: {
    topic: string;
    language: "english" | "hindi" | "urdu" | "roman-urdu" | "roman";
    target_duration_seconds: number;
    cinematic_tone: string;
  }): Promise<StoryGenerationResponse> => {
    if (!accessToken) {
      throw new Error("Please sign in with Supabase before generating a documentary.");
    }

    setLoading(true);
    setLoadError(null);
    try {
      const response = await generateStory(accessToken, payload);
      const [subscriptionResult, jobsResult] = await Promise.all([
        fetchSubscription(accessToken),
        fetchJobs(accessToken),
      ]);
      setSubscription(subscriptionResult);
      setJobs(jobsResult);
      return response;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">AI documentary control room</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Authenticate with Supabase, generate a strict chronological story, and watch the
              pipeline move through facts, assets, narration, animation, and final render stages.
            </p>
          </div>
          {email ? (
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/60 hover:text-cyan-200"
            >
              Sign out {email}
            </button>
          ) : null}
        </div>
      </div>

      {!email ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Sign in with Supabase magic link</h2>
          <p className="mt-3 text-slate-300">
            This dashboard expects your Supabase project to be configured with email auth.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              setMagicLinkState(null);
              const { error } = await supabase.auth.signInWithOtp({ email: magicLinkEmail });
              setMagicLinkState(
                error ? error.message : "Check your inbox for the Supabase login link.",
              );
            }}
          >
            <input
              type="email"
              required
              placeholder="founder@studio.com"
              className="w-full rounded-full border border-white/10 bg-black/20 px-5 py-3 text-white outline-none"
              value={magicLinkEmail}
              onChange={(event) => setMagicLinkEmail(event.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Send magic link
            </button>
          </form>
          {magicLinkState ? <p className="mt-4 text-sm text-cyan-200">{magicLinkState}</p> : null}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-6 text-sm text-rose-100">
          {loadError}
        </div>
      ) : null}

      <PlanSummary subscription={subscription} />
      <GeneratorForm disabled={!email} loading={loading} onGenerate={onGenerate} />
      <JobsPanel jobs={jobs} />
    </div>
  );
}
