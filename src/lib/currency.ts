import { prisma } from "./prisma";

// Seed default — an admin should verify/update the real rate from /admin
// after this ships, it's only a starting point.
export const DEFAULT_USD_TO_GBP = 0.79;

export async function getUsdToGbpRate(): Promise<number> {
  const row = await prisma.exchangeRate.findUnique({ where: { id: 1 } });
  return row?.usdToGbp ?? DEFAULT_USD_TO_GBP;
}
