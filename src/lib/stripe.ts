import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily created so builds succeed without STRIPE_SECRET_KEY set. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

export function siteUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}
