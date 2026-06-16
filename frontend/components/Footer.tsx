import Link from "next/link";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-brand-500" />
          <span className="font-semibold">DocuForge AI</span>
        </div>
        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} DocuForge AI. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-white/50">
          <Link href="#pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
