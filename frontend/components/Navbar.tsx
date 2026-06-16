"use client";

import Link from "next/link";
import { useState } from "react";
import { Clapperboard, Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#06060a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">DocuForge AI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#how-it-works" className="text-sm text-white/60 transition hover:text-white">
            How It Works
          </Link>
          <Link href="#features" className="text-sm text-white/60 transition hover:text-white">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-white/60 transition hover:text-white">
            Pricing
          </Link>
          <Link href="/faq" className="text-sm text-white/60 transition hover:text-white">
            FAQ
          </Link>
          <Link href="/auth/login" className="text-sm text-white/60 transition hover:text-white">
            Sign In
          </Link>
          <Link
            href="/create"
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create Video
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm">
            <Link href="#how-it-works" onClick={() => setOpen(false)}>How It Works</Link>
            <Link href="#features" onClick={() => setOpen(false)}>Features</Link>
            <Link href="#pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/auth/login" onClick={() => setOpen(false)}>Sign In</Link>
            <Link href="/create" onClick={() => setOpen(false)}
              className="rounded-lg bg-violet-600 py-2 text-center font-semibold">
              Create Video
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
