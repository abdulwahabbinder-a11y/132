import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/PricingSection";

export const metadata = { title: "Pricing — DocuGen AI" };

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="pt-32" />
      <PricingSection />
    </>
  );
}
