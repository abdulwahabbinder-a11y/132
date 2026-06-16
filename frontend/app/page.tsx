import Link from "next/link";
import { PricingSection } from "@/components/PricingSection";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <PricingSection />
      <Footer />
    </main>
  );
}
