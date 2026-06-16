"use client";

import { useState } from "react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Mail, MessageSquare, MapPin, Send, CheckCircle2, Globe } from "lucide-react";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <LegalPageLayout title="Contact Us" lastUpdated="June 16, 2025">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-6 text-white/60">
            Have a question, need support, or want to discuss enterprise plans?
            We&apos;d love to hear from you.
          </p>
          <div className="space-y-4">
            {[
              { icon: Globe, label: "Website", value: SITE.url },
              { icon: Mail, label: "Email", value: SITE.email },
              { icon: MessageSquare, label: "Sales", value: SITE.email },
              { icon: MapPin, label: "Office", value: "San Francisco, CA" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
                  <Icon className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 text-lg font-semibold">Message Sent!</h3>
            <p className="text-sm text-white/60">We&apos;ll get back to you within 1–2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-white/50">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/50">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none">
                <option value="">Select a topic</option>
                <option>General Support</option>
                <option>Billing & Refunds</option>
                <option>Technical Issue</option>
                <option>Enterprise / API</option>
                <option>Partnership</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Message</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold hover:bg-violet-500">
              <Send className="h-4 w-4" /> Send Message
            </button>
          </form>
        )}
      </div>
    </LegalPageLayout>
  );
}
