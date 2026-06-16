"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY."
      );
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "signin"
            ? "Sign in to access your studio."
            : "Start with 3 free documentary credits."}
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
        />

        <label className="mt-4 block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
        />

        {message && <p className="mt-4 text-sm text-brand-400">{message}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-slate-400 hover:text-white"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
