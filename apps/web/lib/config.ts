const required = (value: string | undefined, fallback = "") => value ?? fallback;

export const appConfig = {
  apiBaseUrl: required(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000/api"),
  supabaseUrl: required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "https://example-project.supabase.co",
  ),
  supabaseAnonKey: required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "anon-placeholder"),
  stripeFreeUrl: required(
    process.env.NEXT_PUBLIC_STRIPE_FREE_URL,
    "https://buy.stripe.com/test_free_link",
  ),
  stripeProUrl: required(
    process.env.NEXT_PUBLIC_STRIPE_PRO_URL,
    "https://buy.stripe.com/test_pro_link",
  ),
};
