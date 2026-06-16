"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Check your inbox for a verification link.");
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Create account</h1>
      <p className="mt-2 text-white/60">
        You get 3 free documentary credits on signup.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="email@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-white/10 bg-surfaceAlt p-3
                     focus:border-accent focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-white/10 bg-surfaceAlt p-3
                     focus:border-accent focus:outline-none"
        />
        <button disabled={loading} className="btn-primary">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign up
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-300">{info}</p>}
      </form>
    </div>
  );
}
