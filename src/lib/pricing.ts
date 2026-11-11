import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDbAsync } from "./prisma";
import { products as baseProducts, getProduct as getStaticProduct, type Product } from "./products";

type ProductRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["product"]["findMany"]>>[number];
type PriceRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productPrice"]["findMany"]>>[number];
type KindRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productKindOverride"]["findMany"]>>[number];
type AvailabilityRow = Awaited<
  ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productAvailabilityOverride"]["findMany"]>
>[number];
type SizeRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productSize"]["findMany"]>>[number];
type DescriptionRow = Awaited<
  ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productDescriptionOverride"]["findMany"]>
>[number];
type TitleRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productTitleOverride"]["findMany"]>>[number];
type VisibilityRow = Awaited<
  ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productVisibilityOverride"]["findMany"]>
>[number];
type VideoRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["productVideo"]["findMany"]>>[number];
type SiteVideoRow = Awaited<ReturnType<Awaited<ReturnType<typeof getDbAsync>>["siteVideo"]["findUnique"]>>;

type CatalogData = {
  products: ProductRow[];
  prices: PriceRow[];
  kinds: KindRow[];
  availability: AvailabilityRow[];
  sizes: SizeRow[];
  descriptions: DescriptionRow[];
  titles: TitleRow[];
  visibility: VisibilityRow[];
  videos: VideoRow[];
  siteVideo: SiteVideoRow;
};

// All catalog-related tables fetched in one shot, under one "catalog" cache entry. Every
// admin mutation calls updateTag("catalog") so this never serves stale data after an edit —
// it just saves the ~10 live DB round trips every page load used to pay.
//
// This used to be 10 separate unstable_cache() calls (one per table). Cloudflare's tag cache
// is a Durable Object round trip per cache-key staleness check, so 10 separate cache entries
// meant 10 DO round trips per request — the admin page (which reads all of them, once per
// product row) was blowing past Workers' free-tier 10ms CPU budget. Collapsing to a single
// cache entry cuts that to 1 round trip.
//
// Uses getDbAsync() (not the sync `prisma` singleton) because the pages that read this
// (home, shop/[slug], puja-essentials, books, more-about-us, sitemap) are NOT force-dynamic
// and can be invoked during `next build`'s static generation, where only the async,
// build-time-safe Cloudflare context is available.
const cachedCatalogData = unstable_cache(
  async (): Promise<CatalogData> => {
    const db = await getDbAsync();
    const [products, prices, kinds, availability, sizes, descriptions, titles, visibility, videos, siteVideo] = await Promise.all([
      db.product.findMany(),
      db.productPrice.findMany(),
      db.productKindOverride.findMany(),
      db.productAvailabilityOverride.findMany(),
      db.productSize.findMany({ orderBy: { updatedAt: "asc" } }),
      db.productDescriptionOverride.findMany(),
      db.productTitleOverride.findMany(),
      db.productVisibilityOverride.findMany(),
      db.productVideo.findMany(),
      db.siteVideo.findUnique({ where: { id: 1 } }),
    ]);
    return { products, prices, kinds, availability, sizes, descriptions, titles, visibility, videos, siteVideo };
  },
  ["catalog:all"],
  { tags: ["catalog"], revalidate: 3600 },
);

// Deduped within a single request/render — pricedProducts() fans this out to 8 call sites in
// one Promise.all, and without this they'd each independently invoke cachedCatalogData().
const getCatalogData = cache(() => cachedCatalogData());

/** The admin-set video for a single product's detail page, if any. Kept separate from
 * pricedProducts()/CatalogProduct since only the product-detail page needs it, not the
 * Shop/Puja/Books/Home listing grids. */
export async function productVideoFor(slug: string) {
  const { videos } = await getCatalogData();
  return videos.find((r) => r.slug === slug);
}

/** The single admin-set site-wide video (shown on More About Us), if any. */
export async function siteVideo() {
  return (await getCatalogData()).siteVideo;
}

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
  const { products } = await getCatalogData();
  return products.map(fromDbRow);
}

/** The static catalogue plus every admin-created product — no per-field overrides applied. */
export async function baseCatalog(): Promise<Product[]> {
  return [...baseProducts, ...(await dbProducts())];
}

/** True if the slug is a real product, static or admin-created. */
export async function productExists(slug: string): Promise<boolean> {
  if (getStaticProduct(slug)) return true;
  const { products } = await getCatalogData();
  return products.some((p) => p.slug === slug);
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
  const { prices } = await getCatalogData();
  return new Map(prices.map((r) => [r.slug, r.priceCents]));
}

/** slug -> admin-set kind override. */
async function kindOverrides(): Promise<Map<string, ProductKind>> {
  const { kinds } = await getCatalogData();
  return new Map(kinds.map((r) => [r.slug, r.kind]));
}

/** slug -> admin-set sold-out override. */
async function availabilityOverrides(): Promise<Map<string, boolean>> {
  const { availability } = await getCatalogData();
  return new Map(availability.map((r) => [r.slug, r.available]));
}

/** slug -> admin-added size options, in the order they were created. */
async function sizesBySlug(): Promise<Map<string, SizeOption[]>> {
  const { sizes } = await getCatalogData();
  const map = new Map<string, SizeOption[]>();
  for (const r of sizes) {
    const list = map.get(r.slug) ?? [];
    list.push({ label: r.label, priceCents: r.priceCents });
    map.set(r.slug, list);
  }
  return map;
}

/** slug -> admin-set description override (empty string means "intentionally blank"). */
async function descriptionOverrides(): Promise<Map<string, string>> {
  const { descriptions } = await getCatalogData();
  return new Map(descriptions.map((r) => [r.slug, r.description]));
}

/** slug -> admin-set title override (empty string means "intentionally blank"). */
async function titleOverrides(): Promise<Map<string, string>> {
  const { titles } = await getCatalogData();
  return new Map(titles.map((r) => [r.slug, r.title]));
}

/** Slugs the admin has removed from the site ("hidden") — excluded from pricedProducts(). */
async function hiddenSlugs(): Promise<Set<string>> {
  const { visibility } = await getCatalogData();
  return new Set(visibility.filter((r) => r.hidden).map((r) => r.slug));
}

/**
 * The full catalogue with all admin overrides applied. Every public page (Shop, Puja
 * Essentials, Books, Home, sitemap, product-detail) reads through this one function, so
 * filtering hidden products out here is enough to remove them everywhere at once — the
 * un-filtered baseCatalog() is still used by /admin itself so hidden products can be restored.
 */
export async function pricedProducts(): Promise<CatalogProduct[]> {
  const [all, prices, kinds, sizes, descriptions, availability, titles, hidden] = await Promise.all([
    baseCatalog(),
    priceOverrides(),
    kindOverrides(),
    sizesBySlug(),
    descriptionOverrides(),
    availabilityOverrides(),
    titleOverrides(),
    hiddenSlugs(),
  ]);
  return all
    .filter((p) => !hidden.has(p.slug))
    .map((p) => ({
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

export const PRICE_SORT_VALUES = ["price-asc", "price-desc"] as const;
export type PriceSort = (typeof PRICE_SORT_VALUES)[number];

/** Sorts a product list by price — low-to-high or high-to-low. Unrecognized/absent `sort`
 * values are returned unchanged (the catalog's natural order). */
export function sortByPrice<T extends { priceCents: number }>(list: T[], sort?: string): T[] {
  if (sort === "price-asc") return [...list].sort((a, b) => a.priceCents - b.priceCents);
  if (sort === "price-desc") return [...list].sort((a, b) => b.priceCents - a.priceCents);
  return list;
}
