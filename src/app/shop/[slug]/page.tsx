import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import { pricedProducts } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { commerce } from "@/lib/site";
import { siteUrl } from "@/lib/stripe";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { CardIcon, TruckIcon } from "@/components/Icons";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: `${p.title} (${p.purchaseCode})`,
    description: p.description.slice(0, 160),
    openGraph: { images: [{ url: siteUrl() + p.image }] },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const priced = await pricedProducts();
  const p = priced.find((x) => x.slug === slug);
  if (!p) notFound();

  const related = priced.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 3);
  const more = related.length ? related : priced.filter((x) => x.slug !== p.slug).slice(0, 3);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    sku: p.purchaseCode,
    category: p.category,
    image: siteUrl() + p.image,
    offers: {
      "@type": "Offer",
      priceCurrency: commerce.currency.toUpperCase(),
      price: (p.priceCents / 100).toFixed(2),
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      areaServed: commerce.shipCountries.map((c) => c.code),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <div className="container-kk py-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-soft">
          <Link href="/shop" className="hover:text-sindoor">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="hover:text-sindoor">
            {p.category}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-shankh-dark shadow-card lg:sticky lg:top-24 lg:self-start">
            <Image src={p.image} alt={p.title} fill priority sizes="(min-width:1024px) 48vw, 100vw" className="object-contain" />
          </div>

          <div>
            <p className="eyebrow">Purchase Code: {p.purchaseCode}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{p.title}</h1>
            <p className="mt-5 text-3xl font-extrabold text-ink">{formatMoney(p.priceCents)}</p>
            <p className="mt-6 leading-relaxed text-ink-soft">{p.description}</p>

            <div className="mt-8">
              <AddToCartButton slug={p.slug} available={p.available} withQty />
            </div>

            <ul className="mt-8 space-y-3 rounded-2xl bg-white p-5 text-sm shadow-card">
              <li className="flex items-start gap-3">
                <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-sindoor" />
                <span>
                  Ships across the USA, Canada &amp; UK
                  {commerce.freeShippingThresholdCents > 0 && <> · free shipping over {formatMoney(commerce.freeShippingThresholdCents)}</>}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CardIcon className="mt-0.5 h-5 w-5 shrink-0 text-sindoor" />
                <span>Pay securely by card with Stripe, or choose cash on delivery</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sindoor text-[10px] font-bold text-white">✓</span>
                <span>Authentic, sourced directly from artisans in India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="container-kk pb-6 pt-10">
        <h2 className="text-3xl font-semibold">You may also like</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((x) => (
            <ProductCard key={x.slug} product={x} />
          ))}
        </div>
      </section>
    </>
  );
}
