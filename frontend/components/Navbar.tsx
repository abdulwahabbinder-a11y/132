"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-surface-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-brand-500" />
          <span className="text-lg font-bold tracking-tight">DocuForge AI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-white/70 hover:text-white">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-white/70 hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm">
            Dashboard
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="#features" onClick={() => setOpen(false)}>
              Features
            </Link>
            <Link href="#pricing" onClick={() => setOpen(false)}>
              Pricing
            </Link>
            <Link href="/dashboard" className="btn-primary text-center">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
