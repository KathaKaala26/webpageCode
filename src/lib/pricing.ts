import { prisma } from "./prisma";
import { products as baseProducts, type Product } from "./products";

/** slug -> admin-set price override, in cents. */
export async function priceOverrides(): Promise<Map<string, number>> {
  const rows = await prisma.productPrice.findMany();
  return new Map(rows.map((r) => [r.slug, r.priceCents]));
}

/** The full catalogue with any admin price overrides applied. */
export async function pricedProducts(): Promise<Product[]> {
  const overrides = await priceOverrides();
  if (overrides.size === 0) return baseProducts;
  return baseProducts.map((p) => (overrides.has(p.slug) ? { ...p, priceCents: overrides.get(p.slug)! } : p));
}

/** A single product with its admin price override applied, if any. */
export async function pricedProduct(slug: string): Promise<Product | undefined> {
  const p = baseProducts.find((x) => x.slug === slug);
  if (!p) return undefined;
  const override = await prisma.productPrice.findUnique({ where: { slug } });
  return override ? { ...p, priceCents: override.priceCents } : p;
}
