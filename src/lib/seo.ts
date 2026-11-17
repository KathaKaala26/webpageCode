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

export type FaqItem = { question: string; answer: string };

/** FAQPage JSON-LD — targets question-phrased long-tail searches and can surface as a rich result. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
