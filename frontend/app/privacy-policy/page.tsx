import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy Policy — DocuForge AI" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="June 16, 2025">
      <section>
        <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
        <p>
          DocuForge AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          AI video generation platform at {SITE.domain}.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Account Data:</strong> Email address, name, and authentication credentials via Supabase.</li>
          <li><strong>Usage Data:</strong> Video topics, generation history, credit usage, and platform interactions.</li>
          <li><strong>Payment Data:</strong> Processed securely by Stripe. We do not store full card numbers.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies.</li>
          <li><strong>Generated Content:</strong> Scripts, audio files, and video outputs created through our platform.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide and maintain our video generation services</li>
          <li>Process payments and manage subscriptions</li>
          <li>Send service-related communications</li>
          <li>Improve our AI models and platform features</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">4. Third-Party Services</h2>
        <p>We integrate with third-party providers including Supabase, Stripe, ElevenLabs, NVIDIA NIM, Anthropic Claude, and various data scraping APIs. Each provider has its own privacy policy governing their handling of data.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
        <p>We retain your account data for as long as your account is active. Generated videos and scripts are stored for 90 days unless you delete them earlier.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
        <p>You may request access, correction, or deletion of your personal data by contacting us at {SITE.email}. EU/UK residents have additional rights under GDPR.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">7. Contact</h2>
        <p>Questions about this policy? Email <a href={`mailto:${SITE.email}`} className="text-violet-400 hover:underline">{SITE.email}</a> or visit our <a href="/contact" className="text-violet-400 hover:underline">Contact page</a>.</p>
      </section>
    </LegalPageLayout>
  );
}
