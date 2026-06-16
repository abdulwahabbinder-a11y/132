import { Smartphone, Monitor, FileVideo, Clock, Languages, HardDrive } from "lucide-react";

const formats = [
  {
    icon: Smartphone,
    name: "Viral Short",
    ratio: "9:16",
    resolution: "1080×1920",
    duration: "15 – 90 sec",
    platforms: ["TikTok", "Instagram Reels", "YouTube Shorts", "Snapchat"],
    details: [
      "Hook-driven script structure",
      "Fast-paced scene cuts (3–5 sec)",
      "Center-bottom karaoke subtitles",
      "Flux vertical image generation",
    ],
  },
  {
    icon: Monitor,
    name: "Cinematic Documentary",
    ratio: "21:9",
    resolution: "2560×1080",
    duration: "5 – 40 min",
    platforms: ["YouTube", "Vimeo", "Course platforms", "OTT"],
    details: [
      "Vox / BBC documentary pacing",
      "Animated Mapbox map sequences",
      "DeepVideo character cinematics",
      "Archival media from Wikimedia",
    ],
  },
];

const specs = [
  { icon: FileVideo, label: "Codec", value: "H.264 MP4" },
  { icon: Clock, label: "Avg. render", value: "~45 minutes" },
  { icon: Languages, label: "Languages", value: "EN · HI · UR · Roman" },
  { icon: HardDrive, label: "Max file size", value: "Up to 2 GB" },
];

export function OutputSpecs() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">Output Specs</p>
          <h2 className="section-title mb-4">Two Formats, Production-Grade Quality</h2>
          <p className="section-subtitle">
            Every export is a finished, publish-ready MP4 — no post-production editing required.
            Subtitles, transitions, voice, and visuals are baked in.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {formats.map(({ icon: Icon, name, ratio, resolution, duration, platforms, details }) => (
            <div key={name} className="glass-card-hover overflow-hidden">
              <div className="border-b border-white/[0.06] bg-gradient-to-r from-violet-500/10 to-transparent px-7 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{name}</h3>
                    <p className="text-xs text-white/40">
                      {ratio} · {resolution} · {duration}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                  Optimized for
                </p>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <ul className="space-y-2">
                  {details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-sm text-white/45">
                      <div className="h-1 w-1 rounded-full bg-violet-400" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card px-5 py-4 text-center">
              <Icon className="mx-auto mb-2 h-5 w-5 text-violet-400" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">{label}</p>
              <p className="mt-1 text-sm font-semibold text-white/80">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
