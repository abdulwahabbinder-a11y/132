const logos = [
  "Claude AI", "Llama 3.1", "ElevenLabs", "NVIDIA NIM", "Remotion",
  "Flux 1-dev", "Tavily", "Jina AI", "Serper", "Exa", "Stripe", "Supabase",
];

export function LogoMarquee() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.01] py-10">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.25em] text-white/30">
        Powered by industry-leading AI &amp; data infrastructure
      </p>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#050508] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#050508] to-transparent" />
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-sm font-medium text-white/25 transition hover:text-white/50"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
