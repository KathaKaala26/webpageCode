import type { Metadata } from "next";
import Link from "next/link";
import { pricedProducts, sortByPrice } from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import PriceSortChips from "@/components/PriceSortChips";

export const metadata: Metadata = {
  title: "Shop Pattachitra & Indian Art Online",
  description:
    "Shop authentic, handmade Pattachitra paintings and palm-leaf art — buy Indian art online, sourced directly from artisans in India. Ships to the USA, Canada & UK.",
  alternates: { canonical: "/shop" },
  openGraph: { url: "/shop" },
};
export const dynamic = "force-dynamic";

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
]);

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; sort?: string }> }) {
  const { category, sort } = await searchParams;
  const priced = (await pricedProducts()).filter((p) => p.showInShop !== false && (p.section ?? "SHOP") === "SHOP");
  const categories = Array.from(new Set(priced.map((p) => p.category)));
  const active = categories.find((c) => c === category);
  const list = sortByPrice(active ? priced.filter((p) => p.category === active) : priced, sort);

  const chip = (label: string, category: string | undefined, on: boolean) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    return (
      <Link
        key={label}
        href={qs ? `/shop?${qs}` : "/shop"}
        scroll={false}
        aria-current={on ? "page" : undefined}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          on ? "border-maroon bg-maroon text-shankh" : "border-ink/15 bg-white text-ink-soft hover:border-maroon hover:text-maroon"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <section className="container-kk py-14 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <SectionHeading as="h1" eyebrow="Online Store" title="Shop the Collection" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-ink-soft">
        Every piece is sourced directly from artisans in India. Add a piece to your cart to purchase by card or cash on delivery.
      </p>

      <nav aria-label="Categories" className="-mx-4 mt-10 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center">
          {chip("All", undefined, !active)}
          {categories.map((c) => chip(c, c, active === c))}
        </div>
      </nav>

      <nav aria-label="Sort by price" className="-mx-4 mt-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center">
          <PriceSortChips basePath="/shop" sort={sort} extraParams={{ category: active }} />
        </div>
      </nav>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 3} />
        ))}
      </div>
    </section>
  );
}
