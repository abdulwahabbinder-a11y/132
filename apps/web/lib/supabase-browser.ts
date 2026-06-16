import { createBrowserClient } from "@supabase/ssr";

import { appConfig } from "@/lib/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
  }
  return browserClient;
}
