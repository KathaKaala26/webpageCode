import type { Metadata } from "next";
import Link from "next/link";
import { pricedProducts } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "PUJA ESSENTIALS" };
export const dynamic = "force-dynamic";

export default async function PujaEssentialsPage() {
  const list = (await pricedProducts()).filter((p) => p.showInShop !== false && p.section === "PUJA_ESSENTIALS");

  if (list.length === 0) {
    return (
      <section className="container-kk py-20 sm:py-28">
        <SectionHeading as="h1" title="Puja Essentials ..... Coming SOON !" />
        <p className="mx-auto mt-10 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
          We&apos;re putting together a curated collection of authentic puja essentials — sourced directly from India
          — to help you bring the rituals and traditions of home into your everyday life. From thalis to incense to
          idols, each piece is chosen with the same care and authenticity as our artwork.
        </p>
        <div className="mt-12 text-center">
          <Link href="/shop" className="btn-primary h-12 px-8">
            Browse our artwork meanwhile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-kk py-14 sm:py-20">
      <SectionHeading as="h1" title="Puja Essentials" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-ink-soft">
        Authentic puja essentials, sourced directly from India. Tap Enquire on any piece and we&apos;ll help you arrange payment and shipping.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 3} />
        ))}
      </div>
    </section>
  );
}
