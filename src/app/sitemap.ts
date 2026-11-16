import type { MetadataRoute } from "next";
import { pricedProducts } from "@/lib/pricing";

const PAGE_PRIORITY: Record<string, number> = {
  "": 1.0,
  "/shop": 0.9,
  "/puja-essentials": 0.7,
  "/books": 0.7,
  "/more-about-us": 0.7,
  "/contact": 0.5,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const pages = ["", "/more-about-us", "/puja-essentials", "/books", "/shop", "/contact"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: PAGE_PRIORITY[p],
  }));
  const products = (await pricedProducts()).filter((p) => p.showInShop !== false);
  return [
    ...pages,
    ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, changeFrequency: "monthly" as const, lastModified: now, priority: 0.8 })),
  ];
}
