import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const PLANS = {
  FREE: {
    name: "Free Plan",
    price: 0,
    priceId: null,
    credits: 3,
    features: [
      "3 documentary videos/month",
      "HD 1080p output",
      "AI script generation",
      "Archival media sourcing",
      "Basic subtitle burn-in",
    ],
    limitations: [
      "No 21:9 cinematic export",
      "No historical character lip-sync",
      "No DeepVideo-V1 rendering",
    ],
  },
  PRO: {
    name: "Pro Plan",
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    credits: 30,
    features: [
      "30 documentary videos/month",
      "4K 21:9 Cinematic output",
      "Llama 3.1 + Qwen 2.5 scripting",
      "Wikimedia + Archive.org media",
      "Pexels + Pixabay stock footage",
      "Flux AI abstract art generation",
      "ElevenLabs voice synthesis",
      "Wan2.1 image animation",
      "LivePortrait lip-sync",
      "DeepVideo-V1 neural rendering",
      "Geopolitical map sequences",
      "Audio ducking + SFX",
      "Word-level subtitle sync",
      "Priority processing queue",
    ],
    limitations: [],
  },
} as const;

export async function createCheckoutSession(priceId: string): Promise<string> {
  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  const { url } = await res.json();
  return url;
}

export async function createPortalSession(): Promise<string> {
  const res = await fetch("/api/stripe/create-portal-session", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create portal session");
  const { url } = await res.json();
  return url;
}
