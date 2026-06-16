"use client";

import Link from "next/link";
import { Clapperboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Clapperboard className="h-5 w-5 text-accent" />
          <span className="font-display text-lg font-semibold tracking-wide">DocuGen AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <Link href="/#features" className="hover:text-white">Pipeline</Link>
          <Link href="/#pricing" className="hover:text-white">Pricing</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/70 hover:text-white">Sign in</Link>
          <Link href="/dashboard" className="btn-primary">Start</Link>
        </div>
      </div>
    </header>
  );
}
