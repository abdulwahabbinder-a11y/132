import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronicleAI Documentary Studio",
  description: "AI documentary generation SaaS for premium long-form YouTube videos."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-sans antialiased">{children}</body>
    </html>
  );
}
