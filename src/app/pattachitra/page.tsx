import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WIX } from "@/lib/products";
import { pricedProducts } from "@/lib/pricing";
import AddToCartButton from "@/components/AddToCartButton";
import SectionHeading from "@/components/SectionHeading";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "PATTACHITRA" };
export const dynamic = "force-dynamic";

const ROOM =
  "These paintings starkly contrast and grab anyone's attention when they meet in a room, making them perfect for any event or to simply decorate your room or house!";

// Section order and headings exactly as on the original Pattachitra page.
const sections = [
  { heading: "Palm Leave Painting", slug: "palm-leave-painting" },
  { heading: "Leelas", slug: "stories-of-life" },
  { heading: "Abstract and Colorful", slug: "abstract-and-colorful" },
  { heading: "Small Art", slug: "small-art-decor" },
  { heading: "Uniquely Pattachitra", slug: "uniquely-pattachitra" },
  { heading: "Vintage", slug: "vintage" },
];

export default async function PattachitraPage() {
  const priced = await pricedProducts();

  return (
    <>
      <section className="bg-white">
        <div className="container-kk grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading as="h1" title="Pattachitra" align="left" />
            {/* The original page's intro text is cut off mid-sentence on Wix; kept as written. */}
            <p className="mt-8 text-lg leading-relaxed text-ink-soft">
              Pattachitra hold a deep importance for the cultural landscape of Odisha, shaping the deep values and belief&apos;s that show and desc…
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
            <Image src={WIX + "62a063_1d28261a7d434a8aa3f8a9090ff91c1b~mv2.jpeg"} alt="Pattachitra" fill priority sizes="(min-width:1024px) 45vw, 92vw" className="object-cover" />
          </div>
        </div>
      </section>

      <div className="container-kk space-y-16 py-16 sm:space-y-24 sm:py-24">
        {sections.map((s, i) => {
          const p = priced.find((x) => x.slug === s.slug);
          if (!p) return null;
          const flip = i % 2 === 1;
          return (
            <section key={s.heading} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <Link
                href={`/shop/${p.slug}`}
                className={`relative block aspect-[622/512] overflow-hidden rounded-3xl bg-shankh-dark shadow-card ${flip ? "lg:order-2" : ""}`}
              >
                <Image src={p.image} alt={s.heading} fill sizes="(min-width:1024px) 45vw, 92vw" className="object-contain transition duration-500 hover:scale-[1.03]" />
              </Link>
              <div>
                <p className="eyebrow">{p.purchaseCode}</p>
                <h2 className="mt-2 text-4xl font-semibold sm:text-5xl">{s.heading}</h2>
                <p className="mt-5 leading-relaxed text-ink-soft">{ROOM}</p>
                <p className="mt-6 text-2xl font-extrabold">{formatMoney(p.priceCents)}</p>
                <div className="mt-5 max-w-sm">
                  <AddToCartButton slug={p.slug} available={p.available} />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
