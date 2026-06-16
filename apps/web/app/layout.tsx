import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocumentaryAI Studio",
  description: "Subscription AI platform for premium documentary video generation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DocumentaryAI<span className="text-gold">.</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-4 py-2 font-medium text-ink hover:bg-gold"
            >
              Dashboard
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
