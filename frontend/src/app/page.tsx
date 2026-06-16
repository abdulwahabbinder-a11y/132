import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PipelineSection } from "@/components/PipelineSection";
import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <PipelineSection />
      <PricingSection />
    </>
  );
}
