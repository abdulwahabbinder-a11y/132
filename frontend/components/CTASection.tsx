import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Create Your First Video?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-white/60">
              Start with 3 free credits. No credit card required. Generate your first
              viral short or documentary in minutes.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-violet-900 transition hover:bg-white/90"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
