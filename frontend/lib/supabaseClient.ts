"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Browser Supabase client used for auth + user-scoped reads (RLS applies).
 * Returns null when env vars are missing so the UI can render in a "demo" state.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
