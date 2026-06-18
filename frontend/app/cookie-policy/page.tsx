import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = { title: "Cookie Policy — DocuForge AI" };

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="June 16, 2025">
      <section>
        <h2 className="text-xl font-semibold text-white">1. What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better experience and understand how our platform is used.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">2. Cookies We Use</h2>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-white/70">Type</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">Purpose</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="px-4 py-3">Essential</td><td className="px-4 py-3 text-white/60">Authentication (Supabase session)</td><td className="px-4 py-3 text-white/60">Session</td></tr>
              <tr><td className="px-4 py-3">Functional</td><td className="px-4 py-3 text-white/60">Remember preferences</td><td className="px-4 py-3 text-white/60">1 year</td></tr>
              <tr><td className="px-4 py-3">Analytics</td><td className="px-4 py-3 text-white/60">Usage statistics (anonymized)</td><td className="px-4 py-3 text-white/60">2 years</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">3. Managing Cookies</h2>
        <p>You can control cookies through your browser settings. Disabling essential cookies may prevent you from logging in. Most browsers allow you to block or delete cookies under Privacy/Security settings.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-white">4. Third-Party Cookies</h2>
        <p>Stripe (payments) and Supabase (authentication) may set their own cookies. Refer to their respective privacy policies for details.</p>
      </section>
    </LegalPageLayout>
  );
}
