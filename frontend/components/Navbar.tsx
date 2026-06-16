"use client";

import Link from "next/link";
import { Clapperboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur">
      <nav className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Clapperboard className="h-6 w-6 text-brand-400" />
          <span>
            Docu<span className="gradient-text">Forge</span> AI
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/#features" className="hidden text-slate-300 hover:text-white sm:block">
            Features
          </Link>
          <Link href="/pricing" className="text-slate-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="btn-primary px-4 py-2">
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
