import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Target, Users, Zap, Globe, Shield, Layers } from "lucide-react";

export const metadata = { title: "About Us — DocuForge AI" };

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    desc: "Every script is grounded in live research from 10+ sources — Tavily, Jina, Serper, Wikipedia, and more — before a single word is written.",
  },
  {
    icon: Zap,
    title: "Speed at Scale",
    desc: "What takes a production team 3–5 days, DocuForge completes in ~45 minutes — research, scripting, voice, visuals, and final render.",
  },
  {
    icon: Users,
    title: "Built for Creators",
    desc: "YouTubers, educators, agencies, and indie filmmakers use DocuForge to publish daily without hiring editors or researchers.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    desc: "English via Llama 3.1, Hindi/Urdu via Qwen 2.5, and 29+ ElevenLabs voice languages for global audiences.",
  },
  {
    icon: Shield,
    title: "Enterprise-Ready",
    desc: "Supabase auth, Stripe billing, admin API key management, and SOC2-ready infrastructure for agencies and teams.",
  },
  {
    icon: Layers,
    title: "Full Pipeline",
    desc: "One platform replaces researchers, scriptwriters, voice actors, graphic designers, and video editors.",
  },
];

const stack = [
  "Claude Sonnet", "Llama 3.1 70B", "Qwen 2.5 72B", "ElevenLabs",
  "Flux 1-dev", "Remotion", "DeepVideo-V1", "LivePortrait",
  "Tavily", "Jina AI", "Serper", "Stripe", "Supabase",
];

export default function AboutPage() {
  return (
    <LegalPageLayout title="About DocuForge AI" lastUpdated="June 16, 2025">
      <section>
        <p className="text-lg leading-relaxed text-white/80">
          DocuForge AI is an end-to-end video production platform that transforms any topic
          into premium documentaries and viral short-form videos — fully automated, from
          live web research to final MP4 export.
        </p>
      </section>

      <section>
        <h2>Our Mission</h2>
        <p>
          We believe professional-quality video content should not require expensive equipment,
          editing expertise, or a full production crew. DocuForge combines 10+ live data scrapers,
          Claude &amp; Llama AI scriptwriting, ElevenLabs narration, Flux image generation,
          DeepVideo character cinematics, and Remotion rendering into one seamless workflow.
        </p>
      </section>

      <section>
        <h2>What We Do</h2>
        <p>
          Creators enter a topic — for example, &ldquo;Why Japan&apos;s population is collapsing&rdquo; —
          and DocuForge handles everything else. Our 6-phase pipeline scrapes live data, synthesizes
          a Claude research brief, writes a scene-by-scene script, generates voice and visuals,
          renders character cinematics, and exports a publish-ready MP4 with burned-in subtitles.
        </p>
        <p>
          Two output formats serve different needs: <strong>9:16 Viral Shorts</strong> for TikTok,
          Reels, and YouTube Shorts; and <strong>21:9 Cinematic Documentaries</strong> for
          long-form YouTube channels and educational content.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {values.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card p-5">
            <Icon className="mb-3 h-5 w-5 text-violet-400" />
            <p className="font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm text-white/50">{desc}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Technology Stack</h2>
        <p className="mb-4">
          DocuForge integrates best-in-class AI and infrastructure services, all configurable
          from the admin dashboard without redeploying code.
        </p>
        <div className="flex flex-wrap gap-2">
          {stack.map((tool) => (
            <span
              key={tool}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50"
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          Have questions or want a demo? Visit our{" "}
          <Link href="/contact" className="text-violet-400 hover:underline">Contact page</Link>{" "}
          or email{" "}
          <a href="mailto:support@docuforge.pro" className="text-violet-400 hover:underline">
            support@docuforge.pro
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
