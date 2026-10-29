import Image from "next/image";
import Link from "next/link";
import { products, WIX } from "@/lib/products";
import { pricedProducts } from "@/lib/pricing";
import { homeSections } from "@/lib/home";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export const dynamic = "force-dynamic";

const INTRO =
  "At Katha and Kaala, we offer a blend of authentic art pieces, from Jagannath temple art filled with Pattachitra, Tanjore artworks filled with gold in the South, and the endless art form of leelas of Lord Krsna. We focus on building trust with our customers. We strive to offer a diverse range of art and authentic pieces because art is something that isn't used once; it is passed down through generations as a legacy.";

export default async function HomePage() {
  const priced = await pricedProducts();
  const sections = await homeSections(priced);

  const gallery = sections.GALLERY;
  const palmLeaf = sections.PALM_LEAF;
  const colorful = sections.COLORFUL;
  const additional = sections.ADDITIONAL;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-maroon-deep">
        <Image
          src={WIX + "11062b_07eb9327e9894512ab608dbc9e49e2fa~mv2.jpg"}
          alt="Intricate Temple Arches"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-maroon-deep/40 via-maroon-deep/30 to-maroon-deep/90" />
        <div className="container-kk flex min-h-[72svh] flex-col items-center justify-center py-24 text-center text-shankh">
          <h1 className="font-display text-6xl font-semibold leading-none text-shankh drop-shadow-lg sm:text-7xl lg:text-8xl">Katha &amp; Kaala</h1>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.45em] text-haldi-light">- Online Store -</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn-gold h-12 px-8">
              Shop the collection
            </Link>
            <Link href="/more-about-us" className="btn h-12 border-2 border-shankh/70 px-8 text-shankh hover:bg-shankh hover:text-maroon">
              Our story
            </Link>
          </div>
        </div>
        <div className="patta-band" />
      </section>

      {/* ── Welcome ──────────────────────────────────────── */}
      <section className="container-kk py-16 sm:py-24">
        <SectionHeading title="Welcome to Our Site" />
        <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
          Our mission is to share the authentic beauty of Indian artwork and culture with the world, particularly reaching out to communities outside of India, including the USA, Canada and the United Kingdom. We believe in the power of art to bridge cultures and foster understanding. By showcasing the rich traditions and vibrant expressions of Indian heritage, we aim to inspire appreciation and connection among diverse audiences. Join us in celebrating the essence of India through its incredible artistic legacy.
        </p>
      </section>

      {/* ── Your Place for Indian Art ────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container-kk grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
            <Image src={gallery[0]?.image ?? ""} alt="Krsna Leelas Pattachitra" fill sizes="(min-width:1024px) 45vw, 92vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading eyebrow="Reservations" title="Your Place for Indian Art" align="left" />
            <div className="prose-kk mt-8">
              <p>{INTRO}</p>
              <p>
                We take great pride in ensuring that our products are not only authentic but also sourced directly from India. Our commitment to excellence means that we carefully select each item, guaranteeing that you receive only the highest quality goods. By working closely with trusted artisans in India, we ensure that every product reflects the rich culture and craftsmanship of the region. You can shop with confidence, knowing that you are supporting genuine artisans and receiving items that tell a story of tradition and integrity. Experience the assurance of authenticity with us today!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Art Gallery ──────────────────────────────── */}
      <section className="container-kk py-16 sm:py-24">
        <SectionHeading title="Our Art Gallery" />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {gallery.map((p) => (
            <article key={p.slug} className="card flex flex-col overflow-hidden">
              <Link href={`/shop/${p.slug}`} className="relative block aspect-[3/2] overflow-hidden bg-shankh-dark">
                <Image src={p.image} alt={p.title} fill sizes="(min-width:768px) 31vw, 92vw" className="object-contain transition duration-500 hover:scale-105" />
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-2xl font-semibold">{p.title}</h3>
                {p.description && <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{p.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Palm Leaf Pattachitra ────────────────────────── */}
      <section className="bg-haldi-pale/60 py-16 sm:py-24">
        <div className="container-kk">
          <SectionHeading title="Palm Leaf Pattachitra" />
          <p className="mx-auto mt-8 max-w-3xl text-center leading-relaxed text-ink-soft">{palmLeaf[0]?.description}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {palmLeaf.map((p) => (
              <ProductCard key={p.slug} product={p} showActions={false} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Colorful Pattachitra ─────────────────────────── */}
      <section className="container-kk py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <SectionHeading title="Colorful Pattachitra" align="left" />
            <div className="prose-kk mt-8">
              <p>
                Discover the captivating world of modern Pattachitra, a beautiful adaptation of one of India’s most treasured traditional art forms. Rooted in centuries of Indian heritage, Pattachitra combines vibrant colors, intricate patterns, and expressive storytelling to create artworks rich in cultural and spiritual significance. Traditionally associated with Odisha, this art form portrays Hindu deities, sacred stories, mythology, and nature. Today, it continues to evolve, blending traditional craftsmanship with contemporary aesthetics.
              </p>
              <p>
                Modern Pattachitra brings the beauty of Indian culture into your home through bold colors, delicate linework, and elaborate designs. These paintings offer a striking way to celebrate India&apos;s artistic heritage while complementing modern interiors.
              </p>
              <p>
                Beyond their decorative appeal, Pattachitra artworks celebrate the creativity, patience, and craftsmanship of artists who preserve cultural stories across generations. Whether displayed in a living room, prayer space, or bedroom, they create an atmosphere of warmth, beauty, and meaning.
              </p>
              <p>
                By embracing modern Pattachitra, you welcome more than art into your surroundings—you celebrate a living tradition that connects the past with the present. With its unique blend of spirituality, cultural pride, and contemporary elegance, Pattachitra transforms ordinary spaces into inspiring expressions of India&apos;s timeless artistic heritage.
              </p>
            </div>
          </div>
          <div className="grid content-start gap-6 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {colorful.map((p) => (
              <ProductCard key={p.slug} product={p} showActions={false} />
            ))}
          </div>
        </div>
      </section>

      {/* ── News ─────────────────────────────────────────── */}
      <section className="bg-maroon py-16 text-shankh sm:py-20">
        <div className="container-kk text-center">
          <p className="eyebrow text-haldi">News</p>
          <h2 className="mt-2 text-4xl font-semibold text-shankh sm:text-5xl">More about this website</h2>
          <p className="mx-auto mt-6 max-w-3xl leading-relaxed text-shankh/85">{INTRO}</p>
        </div>
      </section>

      {/* ── Additional Products ──────────────────────────── */}
      <section className="container-kk py-16 sm:py-24">
        <SectionHeading eyebrow="About" title="Additional Products" />
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {additional.map((p) => (
            <ProductCard key={p.slug} product={p} showActions={false} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/shop" className="btn-primary h-12 px-8">
            See all {products.length} artworks
          </Link>
        </div>
      </section>
    </>
  );
}
