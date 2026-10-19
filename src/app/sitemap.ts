import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const pages = ["", "/more-about-us", "/pattachitra", "/books", "/shop"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const }));
  return [...pages, ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, changeFrequency: "monthly" as const }))];
}
