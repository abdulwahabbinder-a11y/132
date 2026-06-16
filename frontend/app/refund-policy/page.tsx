import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = { title: "Refund Policy — DocuForge AI" };

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy" lastUpdated="June 16, 2025">
      <section>
        <h2 className="text-xl font-semibold text-white">1. Overview</h2>
        <p>We want you to be satisfied with DocuForge AI. This Refund Policy explains when and how you can request a refund for subscription payments.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">2. 7-Day Money-Back Guarantee</h2>
        <p>New Pro subscribers may request a full refund within <strong>7 days</strong> of their first payment if they have used fewer than 3 video credits. Contact support@docuforge.ai with your account email.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">3. Non-Refundable Items</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Subscription renewals after the 7-day window</li>
          <li>Partial month usage after credits have been consumed</li>
          <li>Pay-as-you-go credit top-ups</li>
          <li>Free plan — no charges apply</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">4. Cancellation</h2>
        <p>You may cancel your subscription at any time from your dashboard or by contacting support. Cancellation takes effect at the end of the current billing period. No partial refunds for unused days within a billing cycle.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">5. Failed Generations</h2>
        <p>If a video generation fails due to a platform error (not user misconfiguration), the consumed credit will be automatically restored to your account within 24 hours.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">6. How to Request a Refund</h2>
        <p>Email <a href="mailto:support@docuforge.ai" className="text-violet-400 hover:underline">support@docuforge.ai</a> with your account email, payment date, and reason. We respond within 2 business days. Approved refunds are processed within 5–10 business days to your original payment method.</p>
      </section>
    </LegalPageLayout>
  );
}
