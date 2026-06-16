"use client";

import Link from "next/link";
import { Clapperboard, Home, LayoutDashboard, Settings } from "lucide-react";
import { CreditsBadge } from "./CreditsBadge";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-ink-950 text-white">
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 px-6 py-8">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <Clapperboard className="h-5 w-5 text-accent" />
          <span className="font-display text-lg font-semibold">DocuGen AI</span>
        </Link>

        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <LayoutDashboard className="h-4 w-4" /> Studio
          </Link>
          <Link href="/dashboard/library" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <Home className="h-4 w-4" /> Library
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <CreditsBadge />
        </div>
      </aside>

      <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
