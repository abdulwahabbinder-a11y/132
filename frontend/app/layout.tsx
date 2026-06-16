import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "DocuAI — AI Documentary Video Generator",
  description:
    "Create premium cinematic documentary videos automatically. Powered by Llama 3.1, ElevenLabs, Wan2.1, and DeepVideo-V1.",
  keywords: ["AI documentary", "video generator", "SaaS", "Llama", "ElevenLabs"],
  openGraph: {
    title: "DocuAI — AI Documentary Video Generator",
    description: "Create premium cinematic documentary videos in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#16162a",
                color: "#fff",
                border: "1px solid #2a2a4a",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
