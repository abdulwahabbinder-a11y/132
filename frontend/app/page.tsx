import { FeatureGrid } from "@/components/FeatureGrid";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/PricingSection";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <section id="features">
        <FeatureGrid />
      </section>
      <PricingSection />
      <footer className="border-t border-white/5 px-6 py-10 text-center text-sm text-white/40">
        © 2026 DocuGen AI · Built with Next.js, FastAPI, NVIDIA NIM, Remotion.
      </footer>
    </>
  );
}
