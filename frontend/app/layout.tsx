import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DocuForge AI",
  description: "Subscription-based AI documentary video generator",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 bg-brand-950/80">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold">
              DocuForge AI
            </Link>
            <div className="flex gap-6 text-sm text-slate-300">
              <Link href="/dashboard">Dashboard</Link>
              <a href="#pricing">Pricing</a>
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
