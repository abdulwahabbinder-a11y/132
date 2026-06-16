"use client";

import Link from "next/link";
import { Clapperboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/20 text-brand-400">
            <Clapperboard size={20} />
          </span>
          DocuForge<span className="text-brand-400">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/#features" className="hover:text-white">
            Features
          </Link>
          <Link href="/#pipeline" className="hover:text-white">
            Pipeline
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
