import { PricingSection } from "@/components/PricingSection";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CTASection } from "@/components/CTASection";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06060a]">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
