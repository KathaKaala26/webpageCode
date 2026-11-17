import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WIX } from "@/lib/products";
import { siteVideo } from "@/lib/pricing";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import SectionHeading from "@/components/SectionHeading";
import ProductVideoPlayer from "@/components/ProductVideoPlayer";

export const metadata: Metadata = {
  title: "About Us — Authentic Indian Art from Odisha",
  description:
    "Learn about Katha & Kaala — sharing authentic Pattachitra, palm-leaf art and Indian culture from Odisha with the USA, Canada & UK.",
  alternates: { canonical: "/more-about-us" },
  openGraph: { url: "/more-about-us" },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "More About Us", path: "/more-about-us" },
]);

const faqs = faqJsonLd([
  {
    question: "What is Pattachitra art?",
    answer:
      "Pattachitra is a traditional Indian folk art form from Odisha. The name combines the Sanskrit words \"patta\" (cloth or canvas) and \"chitra\" (picture), and the style is known for intricate details, bold outlines and vivid natural pigments depicting Hindu deities, mythology and scenes from the Ramayana and Mahabharata.",
  },
  {
    question: "What is the difference between cloth and palm leaf Pattachitra?",
    answer:
      "Cloth Pattachitra is painted on specially prepared, chalk-coated cotton canvas. Palm leaf Pattachitra (also called Tala Patra Chitra) is a related but distinct Odisha art form where the design is etched or painted onto dried palm leaves, which are then stitched together — a painstaking process that can take weeks per piece and produces a one-of-a-kind artwork every time.",
  },
  {
    question: "Is the Indian art sold by Katha & Kaala authentic and handmade?",
    answer:
      "Yes — every Pattachitra and palm-leaf piece we sell is sourced directly from artisans and Chitrakars in Odisha, India, handcrafted using traditional techniques passed down through generations.",
  },
  {
    question: "Where can I buy authentic Indian art online?",
    answer:
      "You can buy authentic Pattachitra paintings, palm-leaf art and other traditional Indian art directly from our online shop at kathakaala.com/shop. Every order ships from our collection in Minnesota, USA.",
  },
  {
    question: "Does Katha & Kaala ship Indian art outside the USA?",
    answer: "Yes — we ship Pattachitra and palm-leaf artwork to the USA, Canada and the United Kingdom.",
  },
]);

export default async function MoreAboutUsPage() {
  const video = await siteVideo();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />
      <section className="bg-white">
        <div className="container-kk grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading as="h1" title="About Us" align="left" />
            <p className="mt-8 text-lg leading-relaxed text-ink-soft">
              From the small suburbs of Minneapolis, we strive to bring the culture of India to the world stage. Bringing the heritage, and timeless culture of the Indian diaspora to people around the globe.
            </p>
          </div>
          <div className="relative aspect-[637/451] overflow-hidden rounded-3xl shadow-card">
            <Image src={WIX + "62a063_567ddc63ec5e45b59b9d812e781d3481~mv2.jpeg"} alt="Pattachitra" fill priority sizes="(min-width:1024px) 45vw, 92vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container-kk py-16 sm:py-24">
        <SectionHeading title="Our Mission" />
        <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
          Our mission is to make art more accessible by bringing the legendary and often undervalued art forms of India onto the world stage. We that art has the power to transcend boundaries and connect people from diverse backgrounds. By showcasing these unique cultural expressions, we aim to elevate the appreciation for India’s rich artistic heritage, which has often been overlooked. Through our platform, we strive to create opportunities for audiences around the globe to engage with, experience, and celebrate the vibrant tapestry of Indian art. We are committed to fostering a deeper understanding of its significance and beauty, ensuring that these remarkable art forms receive the recognition they deserve. In doing so, we hope to inspire a sense of unity and shared appreciation for the diverse perspectives that art offers.
        </p>
      </section>

      <section className="bg-haldi-pale/60 py-16 sm:py-24">
        <div className="container-kk">
          <SectionHeading title="Our Specialty: Pattachitra" />
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <p className="leading-relaxed text-ink-soft">
              Pattachitra is a captivating traditional Indian art form that finds its roots in the vibrant cultures of Odisha. The term &quot;Pattachitra&quot; beautifully combines the Sanskrit words &quot;patta,&quot; meaning cloth or canvas, and &quot;chitra,&quot; which translates to picture or painting. This art is renowned for its intricate details, bold outlines, and vivid colors, bringing to life stunning depictions of Hindu deities, mythological stories, and enchanting scenes from revered epics like the Ramayana and Mahabharata. In Odisha, you will often see Pattachitra paintings featuring Lord Jagannath, Lord Balabhadra, and Goddess Subhadra, showcasing the deep connection between the art and the esteemed Jagannath Temple in Puri. These masterpieces are traditionally crafted by talented artists known as Chitrakars, who have passed down their skills and knowledge through generations. This not only preserves the art form but also highlights its significance as an essential part of India&apos;s rich cultural heritage. Whether you&apos;re an art lover or just curious about Indian traditions, Pattachitra offers a beautiful glimpse into a world of creativity and spirituality.
            </p>
            <div className="relative aspect-[679/434] overflow-hidden rounded-3xl shadow-card">
              <Image src={WIX + "62a063_53299dcdee96481380640a789628ee76~mv2.jpeg"} alt="Pattachitra" fill sizes="(min-width:1024px) 45vw, 92vw" className="object-cover" />
            </div>
          </div>

          <div className="mt-16 grid items-center gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="relative mx-auto aspect-[387/516] w-full max-w-sm overflow-hidden rounded-3xl shadow-card lg:col-span-2">
              <Image src={WIX + "62a063_30f96c7b0e7b42008b71d7954fd2c688~mv2.jpeg"} alt="Pattachitra" fill sizes="(min-width:1024px) 30vw, 90vw" className="object-cover" />
            </div>
            <div className="prose-kk lg:col-span-3">
              <p>
                Pattachitra is created not only for its beauty but also for its spiritual, religious, and cultural significance. The paintings help communicate religious teachings, tell sacred stories, express devotion to Hindu deities, and allow people to connect with their faith. Traditionally, some paintings were made for temple rituals and religious festivals, including periods when images of deities at the Jagannath Temple were temporarily unavailable for public viewing. The materials used in traditional Pattachitra include cotton cloth or specially prepared fabric, natural pigments derived from minerals, plants, and other natural sources, and gum made from natural ingredients to bind the colors. Artists commonly use fine brushes made from animal hair or other suitable fibers to create delicate patterns and precise outlines. The cloth is carefully prepared with a chalk-based coating and polished to create a smooth painting surface. Common colors include white, black, red, yellow, and green, each contributing to the artwork&apos;s distinctive appearance. Today, Pattachitra continues to thrive as both a sacred artistic tradition and a form of cultural expression, appearing on cloth, palm leaves, decorative items, and souvenirs while preserving centuries of Indian craftsmanship, storytelling, and devotion.
              </p>
              <p>
                Pattachitra holds deep spiritual significance in Hinduism, as it serves as a form of devotion and a visual way to connect with the divine. Although it is especially associated with Lord Jagannath in Odisha, Pattachitra also depicts many other Hindu deities, including Lord Krishna, Lord Vishnu, Lord Shiva, Goddess Durga, and Goddess Lakshmi. Through intricate paintings of deities, sacred stories, and religious teachings, artists express their faith while helping devotees reflect on divine qualities and spiritual values. Thus, Pattachitra is more than an art form; it is a sacred expression of bhakti (devotion), preserving Hindu traditions and bringing spirituality into everyday life.
              </p>
              <Link href="/shop?category=Traditional%20Pattachitra" className="btn-primary mt-2">
                Shop these artworks
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-kk py-16 sm:py-24">
        <SectionHeading title="Palm Leaf Pattachitra: A Living Tradition" />
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <p className="leading-relaxed text-ink-soft">
            Alongside cloth Pattachitra, we offer palm leaf art (Tala Patra Chitra) — a closely related but distinct Odisha
            tradition where the artwork is etched or painted directly onto dried palm leaves rather than canvas. Creating a
            single piece can take weeks: the leaves are carefully dried, treated, and stitched together before the Chitrakar
            begins the painstaking work of etching fine lines and filling them with natural pigment. Because every leaf dries
            and ages uniquely, no two palm leaf paintings are ever truly identical, making each one a genuine one-of-a-kind
            piece of handmade Indian art.
          </p>
          <div className="relative aspect-[679/434] overflow-hidden rounded-3xl shadow-card">
            <Image src={WIX + "62a063_64006ddcb44a47fe9427bbf8ff67a794~mv2.jpg"} alt="Palm leaf Pattachitra art" fill sizes="(min-width:1024px) 45vw, 92vw" className="object-cover" />
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href="/shop?category=Palm%20Leaf%20Pattachitra" className="btn-primary">
            Shop palm leaf art
          </Link>
        </div>
      </section>

      <section className="bg-haldi-pale/60 py-16 sm:py-24">
        <div className="container-kk">
          <SectionHeading title="Frequently Asked Questions" />
          <dl className="prose-kk mx-auto mt-10 max-w-3xl divide-y divide-ink/10">
            {faqs.mainEntity.map((f) => (
              <div key={f.name} className="py-5">
                <dt className="text-lg font-semibold text-maroon">{f.name}</dt>
                <dd className="mt-2 text-ink-soft">{f.acceptedAnswer.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {video && (
        <section className="container-kk py-16 sm:py-24">
          <SectionHeading title="Watch our story" />
          <div className="relative mx-auto mt-10 aspect-video max-w-3xl overflow-hidden rounded-3xl shadow-card">
            <ProductVideoPlayer video={video} title="Our story" />
          </div>
        </section>
      )}
    </>
  );
}
