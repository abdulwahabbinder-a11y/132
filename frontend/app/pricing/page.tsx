import { Navbar } from "@/components/layout/Navbar";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/layout/Footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20">
        <PricingSection />
      </div>
      <Footer />
    </main>
  );
}
