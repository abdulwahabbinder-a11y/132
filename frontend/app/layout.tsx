import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DocuGen AI — Cinematic Documentary Generator",
  description:
    "Generate premium, high-retention documentary videos with AI scripting, archival scraping, ElevenLabs narration, and Remotion-powered assembly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-white">
        <div className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid-radial" aria-hidden />
          {children}
        </div>
      </body>
    </html>
  );
}
