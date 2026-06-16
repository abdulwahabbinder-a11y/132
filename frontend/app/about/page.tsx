import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Target, Users, Zap } from "lucide-react";

export const metadata = { title: "About Us — DocuForge AI" };

export default function AboutPage() {
  return (
    <LegalPageLayout title="About DocuForge AI" lastUpdated="June 16, 2025">
      <section>
        <p className="text-lg text-white/80">
          DocuForge AI is an AI video production platform that transforms any topic into
          premium documentaries and viral short-form videos — fully automated.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">Our Mission</h2>
        <p>
          We believe everyone should be able to create professional-quality video content
          without expensive equipment, editing skills, or production teams. Our platform
          combines 10+ live data sources, Claude &amp; Llama AI, ElevenLabs voice, Flux
          imagery, and Remotion rendering into one seamless workflow.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Target, title: "Accuracy First", desc: "Multi-source research before every script" },
          { icon: Zap, title: "Speed", desc: "Topic to video in under 60 minutes" },
          { icon: Users, title: "For Creators", desc: "YouTubers, educators, marketers" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <Icon className="mb-2 h-5 w-5 text-violet-400" />
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-white/50">{desc}</p>
          </div>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">Contact Us</h2>
        <p>Have questions? Visit our <Link href="/contact" className="text-violet-400 hover:underline">Contact page</Link> or email support@docuforge.ai.</p>
      </section>
    </LegalPageLayout>
  );
}
