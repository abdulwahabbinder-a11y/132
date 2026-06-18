import { PricingSection } from "@/components/PricingSection";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CTASection } from "@/components/CTASection";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LogoMarquee } from "@/components/LogoMarquee";
import { UseCases } from "@/components/UseCases";
import { TechPipeline } from "@/components/TechPipeline";
import { Testimonials } from "@/components/Testimonials";
import { ComparisonTable } from "@/components/ComparisonTable";
import { OutputSpecs } from "@/components/OutputSpecs";
import { FAQSection } from "@/components/FAQSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />
      <Hero />
      <LogoMarquee />
      <HowItWorks />
      <TechPipeline />
      <Features />
      <OutputSpecs />
      <UseCases />
      <ComparisonTable />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
