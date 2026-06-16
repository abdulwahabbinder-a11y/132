import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "DocuForge — AI Video Production Platform",
  description:
    "Transform any topic into viral shorts and cinematic documentaries. 10+ live data sources, Claude AI research, ElevenLabs voice, Flux visuals, Remotion rendering.",
  keywords: ["AI video generator", "documentary maker", "viral shorts", "TikTok video AI"],
  openGraph: {
    title: "DocuForge — Turn Topics Into Viral Videos",
    description: "Automated AI video production from research to final MP4.",
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
