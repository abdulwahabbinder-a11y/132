"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <Dashboard />
    </main>
  );
}
