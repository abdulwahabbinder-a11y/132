"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });
    setIsSubmitting(false);
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow">
      <p className="text-sm uppercase tracking-[0.3em] text-signal">Secure access</p>
      <h2 className="mt-3 text-2xl font-semibold">Start a studio session</h2>
      <p className="mt-2 text-sm text-slate-300">
        Supabase magic-link auth protects generation credits and keeps each documentary job tied to your account.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="producer@example.com"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-signal/40 transition focus:ring-4"
        />
        <button
          type="button"
          onClick={signIn}
          disabled={!email || isSubmitting}
          className="rounded-2xl bg-signal px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Sign in"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
