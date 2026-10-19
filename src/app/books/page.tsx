import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "BOOKS" };

export default function BooksPage() {
  return (
    <section className="container-kk py-20 sm:py-28">
      <SectionHeading as="h1" title="Books ..... Coming SOON !" />
      <p className="mx-auto mt-10 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
        We take pride in sourcing our books directly from India, allowing us to provide a diverse range of stories that meet the educational needs of parents seeking to enrich their children&apos;s learning experiences. Our features meticulously selected narratives that not only entertain but impart valuable life lessons and cultural insights. By embracing the richness of Indian literature, we aim to foster a deep appreciation for reading and storytelling among young readers. Our commitment to quality and authenticity ensures that every book serves as a meaningful tool for parents who wish to educate their children through engaging and thought-provoking tales.
      </p>
      <div className="mt-12 text-center">
        <Link href="/shop" className="btn-primary h-12 px-8">
          Browse our artwork meanwhile
        </Link>
      </div>
    </section>
  );
}
