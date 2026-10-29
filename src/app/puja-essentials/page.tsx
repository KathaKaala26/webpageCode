import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "PUJA ESSENTIALS" };

export default function PujaEssentialsPage() {
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
