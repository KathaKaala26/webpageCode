import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare Workers forbids reusing a pooled Postgres connection across requests (isolates
// get recycled, and a long-lived pg.Pool can't survive that) — so unlike a traditional Node
// server we can't cache one PrismaClient at module scope. Hyperdrive does the real connection
// pooling at the edge, so a fresh adapter+client per request is cheap and is the pattern
// OpenNext's own docs recommend: https://opennext.js.org/cloudflare/howtos/db
//
// `max: 1` keeps each request's Pool to a single physical connection — multiple call sites
// (e.g. pricedProducts()'s 8-way Promise.all in src/lib/pricing.ts) share this one client via
// React's cache() below, so without this they'd each try to open their own connection and
// blow past Supabase's session-pool cap (hit locally during `next build`: "max clients
// reached in session mode - max clients are limited to pool_size: 15").
function buildClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString, max: 1, maxUses: 1 });
  return new PrismaClient({ adapter });
}

/**
 * Client for code that only ever runs inside a live request — Server Actions, Route
 * Handlers, and pages marked `force-dynamic` (never during `next build`'s static
 * generation). Falls back to a plain DATABASE_URL connection outside the Workers/next-dev
 * runtime (e.g. the standalone scripts/compress-existing-images.ts maintenance script).
 *
 * Wrapped in React's cache() so every call within the same request/render reuses the same
 * client instead of opening a new Postgres connection each time — this is required, not just
 * an optimization (see buildClient's comment above).
 */
export const getDb = cache((): PrismaClient => {
  try {
    const { env } = getCloudflareContext();
    const connectionString = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE?.connectionString;
    if (connectionString) return buildClient(connectionString);
  } catch {
    // Not running under the OpenNext Cloudflare runtime — fall through to DATABASE_URL.
  }
  return buildClient(process.env.DATABASE_URL ?? "");
});

/**
 * Async, build-time-safe client for code that may run during static generation (ISR/SSG) —
 * currently src/lib/pricing.ts and src/lib/home.ts, which back pages that are NOT
 * force-dynamic (home, shop/[slug], puja-essentials, books, more-about-us, sitemap).
 * Also cache()-wrapped — see getDb() above.
 */
export const getDbAsync = cache(async (): Promise<PrismaClient> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const connectionString = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE?.connectionString;
    if (connectionString) return buildClient(connectionString);
  } catch {
    // Not running under the OpenNext Cloudflare runtime — fall through to DATABASE_URL.
  }
  return buildClient(process.env.DATABASE_URL ?? "");
});

/**
 * Drop-in replacement for the old module-scoped `prisma` singleton — safe ONLY in contexts
 * guaranteed to run inside a live request (see getDb() above). Every property access
 * resolves the (request-cached) client, so this must not be destructured/stored ahead of
 * time (`const { order } = prisma` would freeze a stale reference) — always chain off
 * `prisma` directly, as every existing call site already does (`prisma.order.findMany(...)`).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
