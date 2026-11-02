import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { products as baseProducts, getProduct as getStaticProduct, type Product } from "./products";

// Raw catalog rows, cached under the "catalog" tag. Every admin mutation
// calls updateTag("catalog") so this never serves stale data after an edit —
// it just saves the ~8 live DB round trips every page load used to pay.
const cachedProductRows = unstable_cache(() => prisma.product.findMany(), ["catalog:products"], { tags: ["catalog"], revalidate: 3600 });
const cachedPriceRows = unstable_cache(() => prisma.productPrice.findMany(), ["catalog:prices"], { tags: ["catalog"], revalidate: 3600 });
const cachedKindRows = unstable_cache(() => prisma.productKindOverride.findMany(), ["catalog:kinds"], { tags: ["catalog"], revalidate: 3600 });
const cachedAvailabilityRows = unstable_cache(() => prisma.productAvailabilityOverride.findMany(), ["catalog:availability"], {
  tags: ["catalog"],
  revalidate: 3600,
});
const cachedSizeRows = unstable_cache(() => prisma.productSize.findMany({ orderBy: { updatedAt: "asc" } }), ["catalog:sizes"], {
  tags: ["catalog"],
  revalidate: 3600,
});
const cachedDescriptionRows = unstable_cache(() => prisma.productDescriptionOverride.findMany(), ["catalog:descriptions"], {
  tags: ["catalog"],
  revalidate: 3600,
});
const cachedTitleRows = unstable_cache(() => prisma.productTitleOverride.findMany(), ["catalog:titles"], { tags: ["catalog"], revalidate: 3600 });

/** Converts an admin-created DB Product row into the shared Product shape. */
function fromDbRow(r: {
  slug: string;
  purchaseCode: string;
  title: string;
  category: string;
  section: "SHOP" | "PUJA_ESSENTIALS" | "BOOKS";
  priceCents: number;
  description: string;
  available: boolean;
}): Product {
  return {
    slug: r.slug,
    purchaseCode: r.purchaseCode,
    codeFromSite: false,
    title: r.title,
    category: r.category,
    image: `/img/${r.slug}`,
    priceCents: r.priceCents,
    description: r.description,
    available: r.available,
    section: r.section,
    showInShop: true,
  };
}

/** Admin-created products (see Product in prisma/schema.prisma), converted to the shared Product shape. */
async function dbProducts(): Promise<Product[]> {
  const rows = await cachedProductRows();
  return rows.map(fromDbRow);
}

/** The static catalogue plus every admin-created product — no per-field overrides applied. */
export async function baseCatalog(): Promise<Product[]> {
  return [...baseProducts, ...(await dbProducts())];
}

/** True if the slug is a real product, static or admin-created. */
export async function productExists(slug: string): Promise<boolean> {
  if (getStaticProduct(slug)) return true;
  const row = await prisma.product.findUnique({ where: { slug }, select: { slug: true } });
  return Boolean(row);
}

export type ProductKind = "ART_FRAME" | "HOME_DECOR";

export type SizeOption = { label: string; priceCents: number };

/** A catalogue product with all admin overrides (price, kind, sizes, description) merged in. */
export type CatalogProduct = Product & {
  kind: ProductKind;
  sizes: SizeOption[];
};

/** slug -> admin-set price override, in cents. */
export async function priceOverrides(): Promise<Map<string, number>> {
  const rows = await cachedPriceRows();
  return new Map(rows.map((r) => [r.slug, r.priceCents]));
}

/** slug -> admin-set kind override. */
async function kindOverrides(): Promise<Map<string, ProductKind>> {
  const rows = await cachedKindRows();
  return new Map(rows.map((r) => [r.slug, r.kind]));
}

/** slug -> admin-set sold-out override. */
async function availabilityOverrides(): Promise<Map<string, boolean>> {
  const rows = await cachedAvailabilityRows();
  return new Map(rows.map((r) => [r.slug, r.available]));
}

/** slug -> admin-added size options, in the order they were created. */
async function sizesBySlug(): Promise<Map<string, SizeOption[]>> {
  const rows = await cachedSizeRows();
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
  const rows = await cachedDescriptionRows();
  return new Map(rows.map((r) => [r.slug, r.description]));
}

/** slug -> admin-set title override (empty string means "intentionally blank"). */
async function titleOverrides(): Promise<Map<string, string>> {
  const rows = await cachedTitleRows();
  return new Map(rows.map((r) => [r.slug, r.title]));
}

/** The full catalogue with all admin overrides applied. */
export async function pricedProducts(): Promise<CatalogProduct[]> {
  const [all, prices, kinds, sizes, descriptions, availability, titles] = await Promise.all([
    baseCatalog(),
    priceOverrides(),
    kindOverrides(),
    sizesBySlug(),
    descriptionOverrides(),
    availabilityOverrides(),
    titleOverrides(),
  ]);
  return all.map((p) => ({
    ...p,
    priceCents: prices.get(p.slug) ?? p.priceCents,
    description: descriptions.has(p.slug) ? descriptions.get(p.slug)! : p.description,
    kind: kinds.get(p.slug) ?? "ART_FRAME",
    sizes: sizes.get(p.slug) ?? [],
    available: availability.get(p.slug) ?? p.available,
    title: titles.has(p.slug) ? titles.get(p.slug)! : p.title,
  }));
}

/** A single product with its admin overrides applied, if any. */
export async function pricedProduct(slug: string): Promise<CatalogProduct | undefined> {
  return (await pricedProducts()).find((p) => p.slug === slug);
}
