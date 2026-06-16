"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { videosFromCredits } from "@/lib/credits";
import {
  Clapperboard,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/create", label: "Create", icon: Plus },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard", label: "Documentary", icon: LayoutDashboard },
  { href: "/shorts/wizard", label: "Viral Shorts", icon: Zap },
];

const BOTTOM_NAV = [
  { href: "/admin", label: "Admin & API Keys", icon: Shield },
  { href: "/#pricing", label: "Billing", icon: CreditCard },
];

interface VidrushShellProps {
  children: React.ReactNode;
  credits?: number;
}

export function VidrushShell({ children, credits }: VidrushShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      {/* Left Sidebar — Vidrush style */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[220px] flex-col border-r border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">DocuForge</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t border-white/[0.06] px-3 py-3">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white/80"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {credits !== undefined && (
          <div className="mx-3 mb-4 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Credits</p>
            <p className="text-lg font-bold text-violet-400">{credits}</p>
            <p className="text-[10px] text-white/35">
              {videosFromCredits(credits)} video{videosFromCredits(credits) !== 1 ? "s" : ""} left
            </p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="ml-[220px] flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-8 backdrop-blur-md">
          <div />
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              Personal Workspace
            </span>
            <Link
              href="/create"
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Video
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
