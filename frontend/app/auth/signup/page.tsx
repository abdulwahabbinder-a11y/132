"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isPlaceholderSupabase } from "@/lib/demo-auth";
import { Film } from "lucide-react";
import { CREDITS_PER_VIDEO, FREE_PLAN_CREDITS } from "@/lib/credits";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isPlaceholderSupabase()) {
      setError(
        "Account signup requires a connected Supabase project. In preview mode, use Sign In with admin credentials."
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-pattern px-6">
        <div className="card max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Check your email</h1>
          <p className="text-white/60">
            We sent a confirmation link to {email}. Click it to activate your account
            with 1 free video ({FREE_PLAN_CREDITS} credits).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-pattern px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Film className="h-8 w-8 text-brand-500" />
            <span className="text-2xl font-bold">DocuForge AI</span>
          </Link>
        </div>

        <div className="card">
          <h1 className="mb-2 text-2xl font-bold">Create Account</h1>
          <p className="mb-6 text-sm text-white/50">
            Start with 1 free video — {FREE_PLAN_CREDITS} credits ({CREDITS_PER_VIDEO} per render)
          </p>

          {isPlaceholderSupabase() && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Preview mode: signup is disabled until Supabase is configured.{" "}
              <Link href="/auth/login" className="underline">
                Sign in
              </Link>{" "}
              with admin credentials instead.
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account..." : "Sign Up Free"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
