import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "I went from spending 3 days per documentary to under an hour. The multi-source research alone saves me 6+ hours of manual fact-checking. My retention rate jumped 40% after switching to DocuForge scripts.",
    name: "Marcus Chen",
    role: "History YouTuber · 280K subs",
    avatar: "MC",
  },
  {
    quote:
      "We produce 15 viral shorts per week for our agency clients. The Claude research brief is incredibly detailed — clients think we have a full research team. ROI on the $29 Pro plan is insane.",
    name: "Sarah Okonkwo",
    role: "Founder, ViralFrame Agency",
    avatar: "SO",
  },
  {
    quote:
      "As an educator, factual accuracy matters. DocuForge pulling from Wikipedia, Serper, and NewsAPI simultaneously gives me confidence in every video I publish to my 50K student audience.",
    name: "Dr. Raj Patel",
    role: "Online Course Creator",
    avatar: "RP",
  },
];

export function Testimonials() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">Testimonials</p>
          <h2 className="section-title mb-4">Trusted by Creators Worldwide</h2>
          <p className="section-subtitle">
            Join thousands of YouTubers, marketers, and educators who automate their
            video production with DocuForge AI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(({ quote, name, role, avatar }) => (
            <div key={name} className="glass-card flex flex-col p-7">
              <Quote className="mb-4 h-8 w-8 text-violet-500/30" />
              <p className="mb-6 flex-1 text-sm leading-relaxed text-white/60">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-white/40">{role}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
