import type { MetadataRoute } from "next";
import { pricedProducts } from "@/lib/pricing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const pages = ["", "/more-about-us", "/puja-essentials", "/books", "/shop"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const }));
  const products = (await pricedProducts()).filter((p) => p.showInShop !== false);
  return [...pages, ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, changeFrequency: "monthly" as const }))];
}
