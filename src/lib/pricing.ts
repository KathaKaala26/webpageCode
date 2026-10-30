import { prisma } from "./prisma";
import { products as baseProducts, type Product } from "./products";

export type ProductKind = "ART_FRAME" | "HOME_DECOR";

export type SizeOption = { label: string; priceCents: number };

/** A catalogue product with all admin overrides (price, kind, sizes, description) merged in. */
export type CatalogProduct = Product & {
  kind: ProductKind;
  sizes: SizeOption[];
};

/** slug -> admin-set price override, in cents. */
export async function priceOverrides(): Promise<Map<string, number>> {
  const rows = await prisma.productPrice.findMany();
  return new Map(rows.map((r) => [r.slug, r.priceCents]));
}

/** slug -> admin-set kind override. */
async function kindOverrides(): Promise<Map<string, ProductKind>> {
  const rows = await prisma.productKindOverride.findMany();
  return new Map(rows.map((r) => [r.slug, r.kind]));
}

/** slug -> admin-set sold-out override. */
async function availabilityOverrides(): Promise<Map<string, boolean>> {
  const rows = await prisma.productAvailabilityOverride.findMany();
  return new Map(rows.map((r) => [r.slug, r.available]));
}

/** slug -> admin-added size options, in the order they were created. */
async function sizesBySlug(): Promise<Map<string, SizeOption[]>> {
  const rows = await prisma.productSize.findMany({ orderBy: { updatedAt: "asc" } });
  const map = new Map<string, SizeOption[]>();
  for (const r of rows) {
    const list = map.get(r.slug) ?? [];
    list.push({ label: r.label, priceCents: r.priceCents });
    map.set(r.slug, list);
  }
  return map;
}

/** slug -> admin-set description override (empty string means "intentionally blank"). */
async function descriptionOverrides(): Promise<Map<string, string>> {
  const rows = await prisma.productDescriptionOverride.findMany();
  return new Map(rows.map((r) => [r.slug, r.description]));
}

/** The full catalogue with all admin overrides applied. */
export async function pricedProducts(): Promise<CatalogProduct[]> {
  const [prices, kinds, sizes, descriptions, availability] = await Promise.all([
    priceOverrides(),
    kindOverrides(),
    sizesBySlug(),
    descriptionOverrides(),
    availabilityOverrides(),
  ]);
  return baseProducts.map((p) => ({
    ...p,
    priceCents: prices.get(p.slug) ?? p.priceCents,
    description: descriptions.has(p.slug) ? descriptions.get(p.slug)! : p.description,
    kind: kinds.get(p.slug) ?? "ART_FRAME",
    sizes: sizes.get(p.slug) ?? [],
    available: availability.get(p.slug) ?? p.available,
  }));
}

/** A single product with its admin overrides applied, if any. */
export async function pricedProduct(slug: string): Promise<CatalogProduct | undefined> {
  const p = baseProducts.find((x) => x.slug === slug);
  if (!p) return undefined;
  const [price, kind, sizeRows, description, availability] = await Promise.all([
    prisma.productPrice.findUnique({ where: { slug } }),
    prisma.productKindOverride.findUnique({ where: { slug } }),
    prisma.productSize.findMany({ where: { slug }, orderBy: { updatedAt: "asc" } }),
    prisma.productDescriptionOverride.findUnique({ where: { slug } }),
    prisma.productAvailabilityOverride.findUnique({ where: { slug } }),
  ]);
  return {
    ...p,
    priceCents: price?.priceCents ?? p.priceCents,
    description: description ? description.description : p.description,
    kind: kind?.kind ?? "ART_FRAME",
    sizes: sizeRows.map((r) => ({ label: r.label, priceCents: r.priceCents })),
    available: availability?.available ?? p.available,
  };
}
