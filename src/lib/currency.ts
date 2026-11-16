import type { PrismaClient } from "@prisma/client";

// Seed default — an admin should verify/update the real rate from /admin
// after this ships, it's only a starting point.
export const DEFAULT_USD_TO_GBP = 0.79;

/** Takes an explicit client so callers share one request-scoped Postgres connection
 *  instead of opening a second one (see the comment in /api/checkout/route.ts). */
export async function getUsdToGbpRate(db: Pick<PrismaClient, "exchangeRate">): Promise<number> {
  const row = await db.exchangeRate.findUnique({ where: { id: 1 } });
  return row?.usdToGbp ?? DEFAULT_USD_TO_GBP;
}
