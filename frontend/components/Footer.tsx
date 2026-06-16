import Link from "next/link";
import { Clapperboard, Mail, MapPin } from "lucide-react";

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
    { label: "Blog", href: "/about" },
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
    <footer className="border-t border-white/[0.06] bg-[#06060a]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Clapperboard className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">DocuForge AI</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/40">
              AI-powered video production platform. Research, script, generate, and
              render premium documentaries and viral shorts automatically.
            </p>
            <div className="space-y-2 text-sm text-white/40">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-violet-400" />
                support@docuforge.ai
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-violet-400" />
                San Francisco, CA
              </p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/40 transition hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} DocuForge AI, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/30">
            <Link href="/privacy-policy" className="hover:text-white/60">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-white/60">Terms</Link>
            <Link href="/refund-policy" className="hover:text-white/60">Refunds</Link>
            <Link href="/disclaimer" className="hover:text-white/60">Disclaimer</Link>
            <Link href="/cookie-policy" className="hover:text-white/60">Cookies</Link>
            <Link href="/contact" className="hover:text-white/60">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
