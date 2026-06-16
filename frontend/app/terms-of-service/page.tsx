import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = { title: "Terms of Service — DocuForge AI" };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="June 16, 2025">
      <section>
        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
        <p>By accessing or using DocuForge AI, you agree to be bound by these Terms of Service. If you do not agree, do not use our platform.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
        <p>DocuForge AI provides an automated AI video generation platform including documentary and viral short creation, web research, scriptwriting, voice synthesis, and video rendering.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">3. Account &amp; Credits</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate registration information.</li>
          <li>Free accounts receive 5 credits (1 video). Pro accounts receive 30 credits (6 videos) per billing cycle.</li>
          <li>Each video render costs 5 credits (research → script → assets → render).</li>
          <li>Credits do not roll over unless stated in your plan.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
        <p>You agree not to use DocuForge AI to generate content that is illegal, defamatory, harassing, infringing on intellectual property, promoting violence, or containing explicit material involving minors. We reserve the right to terminate accounts violating these terms.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
        <p>You retain ownership of content you input. Generated videos are licensed to you for commercial and personal use on paid plans. Free plan outputs are for personal, non-commercial use only.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
        <p>DocuForge AI is provided &ldquo;as is.&rdquo; We are not liable for indirect, incidental, or consequential damages arising from use of our platform. See our <a href="/disclaimer" className="text-violet-400 hover:underline">Disclaimer</a> for full details.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">7. Governing Law</h2>
        <p>These terms are governed by the laws of the State of California, USA. Disputes shall be resolved in San Francisco County courts.</p>
      </section>
    </LegalPageLayout>
  );
}
