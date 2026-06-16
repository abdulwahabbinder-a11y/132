import Link from "next/link";
import { Clapperboard, Mail, MapPin, Twitter, Github, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Create Video", href: "/create" },
    { label: "Viral Shorts", href: "/shorts/wizard" },
    { label: "Documentary", href: "/dashboard" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/faq" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Pipeline", href: "/#pipeline" },
    { label: "Features", href: "/#features" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#030306]">
      {/* Newsletter strip */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div>
            <p className="font-display font-semibold">Stay updated</p>
            <p className="text-sm text-white/40">New features, AI model updates, and creator tips.</p>
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm placeholder:text-white/25 focus:border-violet-500 focus:outline-none"
            />
            <button className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Clapperboard className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold">DocuForge AI</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/40">
              The AI video production platform that researches, scripts, narrates, and
              renders premium documentaries and viral shorts from a single topic prompt.
            </p>
            <div className="mb-6 space-y-2.5 text-sm text-white/40">
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-violet-400" />
                support@docuforge.ai
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-violet-400" />
                548 Market St, San Francisco, CA 94104
              </p>
            </div>
            <div className="flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition hover:border-violet-500/30 hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/40 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} DocuForge AI, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/25">
            <Link href="/privacy-policy" className="hover:text-white/50">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-white/50">Terms</Link>
            <Link href="/refund-policy" className="hover:text-white/50">Refunds</Link>
            <Link href="/disclaimer" className="hover:text-white/50">Disclaimer</Link>
            <Link href="/cookie-policy" className="hover:text-white/50">Cookies</Link>
            <Link href="/contact" className="hover:text-white/50">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
