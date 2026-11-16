import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily created so builds succeed without STRIPE_SECRET_KEY set. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // Force the Fetch-based transport — the SDK's default Node `https` client relies on
  // raw TCP sockets, which Cloudflare Workers doesn't support; without this the request
  // hangs until the Workers runtime kills it, instead of erroring or succeeding.
  if (!client) client = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

export function siteUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}
