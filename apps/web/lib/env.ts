export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  freePlanUrl: process.env.NEXT_PUBLIC_STRIPE_FREE_PRICE_URL ?? "#",
  proPlanUrl: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_URL ?? "#"
};
