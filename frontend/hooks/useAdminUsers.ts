"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { isDemoAdminSession } from "@/lib/demo-auth";
import { DEMO_ADMIN_USERS } from "@/lib/demo-data";
import type { AdminUsersData } from "@/lib/admin/types";

export function useAdminUsers(enabled: boolean) {
  const [data, setData] = useState<AdminUsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    if (isDemoAdminSession()) {
      setData(DEMO_ADMIN_USERS);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    api.setToken(session.access_token);
    try {
      const result = await api.getAdminUsers();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
