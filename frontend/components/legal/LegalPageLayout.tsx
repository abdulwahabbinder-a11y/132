import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="font-display mb-2 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mb-10 text-sm text-white/40">Last updated: {lastUpdated}</p>
        <article className="prose-legal space-y-6 text-white/75">{children}</article>
      </div>
      <Footer />
    </main>
  );
}
