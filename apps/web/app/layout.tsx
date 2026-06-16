import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "DocGen | AI Documentary Video Generator",
  description:
    "Subscription-based AI documentary generation platform powered by Next.js, FastAPI, Supabase, Stripe, NVIDIA NIM, and Remotion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-black/20 px-6 py-4 backdrop-blur">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              DocGen
            </Link>
            <nav className="flex items-center gap-5 text-sm text-slate-300">
              <Link href="/">Overview</Link>
              <Link href="/dashboard">Dashboard</Link>
              <a href="/#pricing">Pricing</a>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
