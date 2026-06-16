import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DocuGen — AI Documentary Video Generator",
  description:
    "Premium, high-retention documentary videos auto-produced with Llama 3.1, " +
    "Flux, ElevenLabs, DeepVideo-V1 and Remotion.",
  openGraph: {
    title: "DocuGen",
    description: "Cinematic AI documentaries on demand.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
