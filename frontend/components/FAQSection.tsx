"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CREDITS_PER_VIDEO, FREE_PLAN_CREDITS, PRO_PLAN_VIDEOS } from "@/lib/credits";

const faqs = [
  {
    q: "How long does it take to generate a video?",
    a: "Viral shorts (9:16) typically complete in 15–30 minutes. Full documentaries (21:9) take 45–90 minutes depending on duration and scraper response times. You receive real-time progress updates in your dashboard.",
  },
  {
    q: "What data sources does DocuForge research from?",
    a: "Up to 10 parallel scrapers: Tavily, Jina AI, Serper, Firecrawl, Exa, Brave Search, NewsAPI, Google Custom Search, Wikipedia, and Internet Archive. Admins can enable/disable each source from the dashboard.",
  },
  {
    q: "What output formats and resolutions are supported?",
    a: "Viral Shorts export as 9:16 vertical MP4 (720p on Starter, 1080p on Pro). Documentaries export as 21:9 cinematic MP4 at 1080p. All outputs include burned-in center-bottom subtitles with word-level sync.",
  },
  {
    q: "Can I use videos commercially?",
    a: "Pro plan includes full commercial usage rights for YouTube monetization, client deliverables, and paid courses. Free plan outputs are limited to personal, non-commercial use.",
  },
  {
    q: "How do credits work?",
    a: `Each video render costs ${CREDITS_PER_VIDEO} credits. Free accounts get ${FREE_PLAN_CREDITS} credits (1 video). Pro ($29/mo) includes 30 credits — enough for ${PRO_PLAN_VIDEOS} video renders per month.`,
  },
  {
    q: "What happens if generation fails?",
    a: `All ${CREDITS_PER_VIDEO} credits are automatically restored within 24 hours for platform-side failures. You can track job status from your Projects page.`,
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-white/[0.02]"
      >
        <span className="pr-4 font-medium text-white/85">{q}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-violet-400 transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <p className="border-t border-white/[0.06] px-6 pb-5 pt-4 text-sm leading-relaxed text-white/50">
          {a}
        </p>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="border-y border-white/[0.06] bg-white/[0.015] py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="section-label">FAQ</p>
          <h2 className="section-title mb-4">Common Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about credits, formats, research sources, and commercial usage.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            View all 9 questions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
