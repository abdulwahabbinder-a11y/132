import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const perks = [
  "3 free video credits — no card required",
  "Full pipeline: research → script → render",
  "Download MP4 with burned-in subtitles",
  "Cancel Pro subscription anytime",
];

export function CTASection() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/10 to-rose-600/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.2),transparent_60%)]" />
          <div className="relative grid gap-10 p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="section-label !text-violet-300">Get Started Today</p>
              <h2 className="font-display mb-4 text-3xl font-bold md:text-4xl">
                Your Next Viral Video Is One Topic Away
              </h2>
              <p className="mb-6 text-white/55">
                Join creators who publish daily content without a production team.
                Enter a topic, wait ~45 minutes, download your MP4.
              </p>
              <ul className="space-y-2">
                {perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle2 className="h-4 w-4 text-violet-300" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-4 lg:items-end">
              <Link href="/create" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-violet-900 shadow-xl transition hover:bg-white/95 lg:w-auto">
                Create Your First Video
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth/signup" className="text-sm text-white/50 hover:text-white/80">
                Or sign up for free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
