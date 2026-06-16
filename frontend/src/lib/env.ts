import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_FREE_PLAN_URL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRO_PLAN_URL: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_STYLE: z.string().default("mapbox/dark-v11"),
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_FREE_PLAN_URL: process.env.NEXT_PUBLIC_STRIPE_FREE_PLAN_URL,
  NEXT_PUBLIC_STRIPE_PRO_PLAN_URL: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_URL,
  NEXT_PUBLIC_MAPBOX_STYLE: process.env.NEXT_PUBLIC_MAPBOX_STYLE,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
});
