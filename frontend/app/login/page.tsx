"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="glass w-full max-w-md p-8 rounded-2xl space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Welcome to DocuGen AI</h1>
          <p className="mt-2 text-sm text-white/60">
            We'll email you a magic link — no passwords.
          </p>
        </div>

        <div>
          <label className="text-sm text-white/70">Email</label>
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-white/40" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full bg-ink-800/80 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-300">{error}</div>}
        {sent ? (
          <div className="text-emerald-300 text-sm text-center">
            Check your inbox for the magic link.
          </div>
        ) : (
          <button type="submit" disabled={loading || !email} className="btn-primary w-full">
            {loading ? "Sending…" : "Send magic link"}
          </button>
        )}
      </form>
    </main>
  );
}
