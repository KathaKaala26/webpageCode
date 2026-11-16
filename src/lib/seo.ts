import { siteUrl } from "./stripe";

export type BreadcrumbItem = { name: string; path: string };

/** BreadcrumbList JSON-LD for a page's position in the site hierarchy. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
