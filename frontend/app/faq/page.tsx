"use client";

import { useState } from "react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

const faqs = [
  {
    q: "How does DocuForge AI work?",
    a: "Enter a topic, and our platform scrapes live web data from 10+ sources, synthesizes research with Claude AI, writes a script, generates visuals with Flux, narrates with ElevenLabs, and renders a finished video with Remotion + FFmpeg.",
  },
  {
    q: "What video formats are supported?",
    a: "Viral Shorts in 9:16 (TikTok/Reels/Shorts) and Documentaries in 21:9 cinematic aspect ratio. Both include burned-in subtitles.",
  },
  {
    q: "How many free credits do I get?",
    a: "New accounts receive 5 credits — enough for 1 complete video render. Each video costs 5 credits. Upgrade to Pro for 30 credits/month (6 videos) at $29.",
  },
  {
    q: "Can I use generated videos commercially?",
    a: "Yes, on Pro plans. Free plan outputs are for personal, non-commercial use only. See our Terms of Service for details.",
  },
  {
    q: "What languages are supported?",
    a: "English uses Llama 3.1. Hindi, Urdu, and Roman script use Qwen 2.5. ElevenLabs supports multilingual narration.",
  },
  {
    q: "How long does generation take?",
    a: "Viral shorts typically take 15–30 minutes. Full documentaries may take 45–90 minutes depending on length and scraper response times.",
  },
  {
    q: "What if my video generation fails?",
    a: "Failed jobs due to platform errors automatically restore all 5 credits within 24 hours. Check your Projects page for status.",
  },
  {
    q: "How do I cancel my subscription?",
    a: `Cancel anytime from your dashboard or email ${SITE.email}. Access continues until the end of your billing period.`,
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — new Pro subscribers get a 7-day money-back guarantee if fewer than 1 video (5 credits) was rendered. See our Refund Policy.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-4 font-medium">{q}</span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-white/40 transition", open && "rotate-180")} />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-white/55">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <LegalPageLayout title="Frequently Asked Questions" lastUpdated="June 16, 2025">
      <p className="mb-8 text-white/60">
        Can&apos;t find your answer? <a href="/contact" className="text-violet-400 hover:underline">Contact us</a>.
      </p>
      <div>
        {faqs.map((faq) => (
          <FAQItem key={faq.q} {...faq} />
        ))}
      </div>
    </LegalPageLayout>
  );
}
