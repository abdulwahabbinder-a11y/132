"use client";

import Link from "next/link";
import { Film } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Film className="h-5 w-5 text-accent" />
          <span>DocuGen</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/generate" className="btn-primary text-sm">
            New Documentary
          </Link>
        </nav>
      </div>
    </header>
  );
};
