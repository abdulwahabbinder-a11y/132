"use client";

import Link from "next/link";
import { useState } from "react";
import { Clapperboard, Menu, X } from "lucide-react";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#050508]/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold tracking-tight">DocuForge</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="text-[13px] font-medium text-white/50 transition hover:text-white">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="text-[13px] font-medium text-white/50 transition hover:text-white">
            Sign In
          </Link>
          <Link href="/create" className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-violet-600/20 transition hover:brightness-110">
            Create Free
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#050508]/95 px-6 py-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
            ))}
            <Link href="/auth/login" onClick={() => setOpen(false)}>Sign In</Link>
            <Link href="/create" onClick={() => setOpen(false)} className="btn-primary text-center">Create Free</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
