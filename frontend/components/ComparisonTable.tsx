import { Check, X, Minus } from "lucide-react";
import { proPricePerVideo } from "@/lib/credits";

const rows = [
  { feature: "Live web research (10+ sources)", docuforge: true, manual: false, others: "partial" },
  { feature: "Claude AI research synthesis", docuforge: true, manual: false, others: false },
  { feature: "Automated scriptwriting", docuforge: true, manual: false, others: true },
  { feature: "ElevenLabs voice + timestamps", docuforge: true, manual: "partial", others: "partial" },
  { feature: "Flux AI image generation", docuforge: true, manual: false, others: false },
  { feature: "Character lip-sync (DeepVideo)", docuforge: true, manual: false, others: false },
  { feature: "Burned-in subtitles", docuforge: true, manual: true, others: "partial" },
  { feature: "9:16 + 21:9 output", docuforge: true, manual: true, others: "partial" },
  { feature: "Time to produce (avg)", docuforge: "~45 min", manual: "3–5 days", others: "2–4 hrs" },
  { feature: "Cost per video (Pro)", docuforge: proPricePerVideo(), manual: "$500+", others: "$5–15" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="mx-auto h-5 w-5 text-green-400" />;
  if (value === false)
    return <X className="mx-auto h-5 w-5 text-white/20" />;
  if (value === "partial")
    return <Minus className="mx-auto h-5 w-5 text-amber-400/60" />;
  return <span className="text-sm font-medium text-white/70">{value}</span>;
}

export function ComparisonTable() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015] py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <p className="section-label">Comparison</p>
          <h2 className="section-title mb-4">Why DocuForge vs Alternatives</h2>
          <p className="section-subtitle">
            See how our end-to-end pipeline compares to manual editing and generic AI video tools.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                <th className="px-5 py-4 text-left font-medium text-white/50">Feature</th>
                <th className="px-5 py-4 text-center">
                  <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
                    DocuForge
                  </span>
                </th>
                <th className="px-5 py-4 text-center font-medium text-white/40">Manual</th>
                <th className="px-5 py-4 text-center font-medium text-white/40">Other AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map(({ feature, docuforge, manual, others }) => (
                <tr key={feature} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-white/70">{feature}</td>
                  <td className="bg-violet-500/[0.04] px-5 py-3.5 text-center">
                    <Cell value={docuforge} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={manual} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={others} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
