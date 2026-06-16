"use client";

import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

type SupabaseClient = ReturnType<typeof createClient>;

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.");
  }
  browserClient ??= createClient(env.supabaseUrl, env.supabaseAnonKey);
  return browserClient;
}
