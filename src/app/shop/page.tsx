import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/lib/products";
import { pricedProducts } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "SHOP" };
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const priced = await pricedProducts();
  const active = categories.find((c) => c === category);
  const list = active ? priced.filter((p) => p.category === active) : priced;

  const chip = (label: string, href: string, on: boolean) => (
    <Link
      key={label}
      href={href}
      scroll={false}
      aria-current={on ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        on ? "border-maroon bg-maroon text-shankh" : "border-ink/15 bg-white text-ink-soft hover:border-maroon hover:text-maroon"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <section className="container-kk py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Online Store" title="Shop the Collection" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-ink-soft">
        Every piece is sourced directly from artisans in India. Tap Enquire on any piece and we'll help you arrange payment and shipping.
      </p>

      <nav aria-label="Categories" className="-mx-4 mt-10 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center">
          {chip("All", "/shop", !active)}
          {categories.map((c) => chip(c, `/shop?category=${encodeURIComponent(c)}`, active === c))}
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
