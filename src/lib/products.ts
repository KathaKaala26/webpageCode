// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOGUE — the single place to edit prices, codes and stock.
//
// • Every image is the original file from the Wix site (static.wixstatic.com),
//   so nothing has been re-shot, cropped or re-uploaded.
// • PRICES ARE PLACEHOLDERS. Replace priceCents with real prices (in cents:
//   12900 = $129.00) before going live.
// • purchaseCode values marked `codeFromSite: true` are exactly as shown on the
//   Wix site. Codes starting "KK-" are new placeholders for artworks that had
//   no code on the old site — rename them freely.
// • Set `available: false` to mark an artwork as sold (it stays visible).
// ─────────────────────────────────────────────────────────────────────────────

export const WIX = "https://static.wixstatic.com/media/";

export type Category =
  | "Krsna Leelas"
  | "Stories of Life"
  | "Small Art Decor"
  | "Palm Leaf Pattachitra"
  | "Colorful Pattachitra"
  | "Abstract and Colorful"
  | "Uniquely Pattachitra"
  | "Vintage"
  | "Traditional Pattachitra";

export type Product = {
  slug: string;
  purchaseCode: string;
  codeFromSite: boolean;
  title: string;
  // Static catalogue entries are always one of the Category union values,
  // but admin-created products (see Product in prisma/schema.prisma) can use
  // any free-text category — so the field itself is the wider `string`.
  category: string;
  image: string;
  priceCents: number;
  description: string;
  available: boolean;
  featured?: boolean;
  /** false = Home page only, hidden from /shop, the sitemap, and chatbot results. Default true. */
  showInShop?: boolean;
  /** Which top-level page this belongs to. Undefined (all static entries) means "SHOP". */
  section?: "SHOP" | "PUJA_ESSENTIALS" | "BOOKS";
};

/** Strips a baked-in " — CODE" suffix from a title for display contexts that hide the purchase code. */
export function titleWithoutCode(title: string): string {
  return title.replace(/\s+—\s+.*$/, "");
}

const PALM_LEAF =
  "Experience the beauty of a one-of-a-kind masterpiece, meticulously crafted by skilled artisans. Each piece undergoes a painstaking process that takes weeks, involving careful drying, intricate painting, and precise stitching. This dedication ensures that every artwork is unique, reflecting the passion and expertise of its creators. Bring home a true work of art on a simple palm leaf that tells a story of creativity.";

const COLORFUL =
  "Discover the captivating world of modern Pattachitra, a beautiful adaptation of one of India’s most treasured traditional art forms. Rooted in centuries of Indian heritage, Pattachitra combines vibrant colors, intricate patterns, and expressive storytelling to create artworks rich in cultural and spiritual significance.";

const ROOM =
  "These paintings starkly contrast and grab anyone's attention when they meet in a room, making them perfect for any event or to simply decorate your room or house!";

const rawProducts: Product[] = [
  {
    slug: "krsna-leelas",
    purchaseCode: "KK-201",
    codeFromSite: false,
    title: "Krsna Leelas",
    category: "Krsna Leelas",
    image: WIX + "62a063_e329f2be4437462eaf71d6c754e01484~mv2.jpeg",
    priceCents: 28900,
    description:
      "Much of our artwork highlights the timeless, elegant, and enchanting leelas of Lord Krsna. From the playful stories with Maa Yasoda to the enchanting leelas with the Gopis, and the cherished leela of the Lord, as described here.",
    available: true,
    featured: true,
  },
  {
    slug: "stories-of-life",
    purchaseCode: "KK-202",
    codeFromSite: false,
    title: "Stories of Life",
    category: "Stories of Life",
    image: WIX + "62a063_1d28261a7d434a8aa3f8a9090ff91c1b~mv2.jpeg",
    priceCents: 16900,
    description:
      "Many of the artworks we strive to give you illustrate the cycle and leelas of life, the constant stories enshrined with many devathas and incarnations of Bhagavan. These beautifully illustrated masterpieces are truly one of a kind!",
    available: true,
    featured: true,
  },
  {
    slug: "small-art-decor",
    purchaseCode: "KK-203",
    codeFromSite: false,
    title: "Small Art Decor",
    category: "Small Art Decor",
    image: WIX + "62a063_1132517688884f79956415b6f2874315~mv2.jpeg",
    priceCents: 4900,
    description:
      "Small art decorations cover the room in bright and colorfully enigmatic hues of color that bring interest and life in every room they are in !",
    available: true,
    featured: true,
  },
  {
    slug: "palm-leaf-gb101",
    purchaseCode: "GB101",
    codeFromSite: true,
    title: "Palm Leaf Pattachitra — GB101",
    category: "Palm Leaf Pattachitra",
    image: WIX + "62a063_64006ddcb44a47fe9427bbf8ff67a794~mv2.jpg",
    priceCents: 12900,
    description: PALM_LEAF,
    available: true,
  },
  {
    slug: "palm-leaf-kn14",
    purchaseCode: "KN 14",
    codeFromSite: true,
    title: "Palm Leaf Pattachitra — KN 14",
    category: "Palm Leaf Pattachitra",
    image: WIX + "62a063_7f05dc2ef431407189ba0ef71c8a7bde~mv2.jpg",
    priceCents: 12900,
    description: PALM_LEAF,
    available: true,
  },
  {
    // NOTE: the Wix site shows "GB 101" here as well as "GB101" above for a
    // different artwork. Kept as-is; consider giving this one a unique code.
    slug: "palm-leaf-gb-101",
    purchaseCode: "GB 101",
    codeFromSite: true,
    title: "Palm Leaf Pattachitra — GB 101",
    category: "Palm Leaf Pattachitra",
    image: WIX + "62a063_996b5f0949d14faa8fcdb72cbd161325~mv2.jpeg",
    priceCents: 13900,
    description: PALM_LEAF,
    available: true,
  },
  {
    slug: "colorful-hd105",
    purchaseCode: "HD 105",
    codeFromSite: true,
    title: "Colorful Pattachitra — HD 105",
    category: "Colorful Pattachitra",
    image: WIX + "62a063_cc5fc3e40dc34634be32b3bb4a7cd147~mv2.jpeg",
    priceCents: 14900,
    description: COLORFUL,
    available: true,
    featured: true,
  },
  {
    slug: "colorful-rhc150",
    purchaseCode: "RHC 150",
    codeFromSite: true,
    title: "Colorful Pattachitra — RHC 150",
    category: "Colorful Pattachitra",
    image: WIX + "62a063_6e5bef9b720f4bb98a437ea1de062644~mv2.jpg",
    priceCents: 15900,
    description: COLORFUL,
    available: true,
  },
  {
    slug: "abstract-and-colorful",
    purchaseCode: "KK-204",
    codeFromSite: false,
    title: "Abstract and Colorful",
    category: "Abstract and Colorful",
    image: WIX + "62a063_8909b0dce4fc496bab7595585c03cf3f~mv2.jpeg",
    priceCents: 9900,
    description: ROOM,
    available: true,
  },
  {
    slug: "palm-leave-painting",
    purchaseCode: "KK-205",
    codeFromSite: false,
    title: "Palm Leave Painting",
    category: "Palm Leaf Pattachitra",
    image: WIX + "62a063_0052de364c424729aff260648d9366a7~mv2.jpg",
    priceCents: 13900,
    description: ROOM,
    available: true,
  },
  {
    slug: "uniquely-pattachitra",
    purchaseCode: "KK-206",
    codeFromSite: false,
    title: "Uniquely Pattachitra",
    category: "Uniquely Pattachitra",
    image: WIX + "62a063_3d68194098b64a4989328721726c93ce~mv2.jpg",
    priceCents: 11900,
    description: ROOM,
    available: true,
  },
  {
    slug: "vintage",
    purchaseCode: "KK-207",
    codeFromSite: false,
    title: "Vintage",
    category: "Vintage",
    image: WIX + "62a063_0331f35d5da34adeaf4ca15d4f44bb9b~mv2.jpg",
    priceCents: 17900,
    description: ROOM,
    available: true,
  },
  {
    slug: "traditional-pattachitra-i",
    purchaseCode: "KK-208",
    codeFromSite: false,
    title: "Traditional Pattachitra I",
    category: "Traditional Pattachitra",
    image: WIX + "62a063_567ddc63ec5e45b59b9d812e781d3481~mv2.jpeg",
    priceCents: 19900,
    description:
      "Pattachitra is renowned for its intricate details, bold outlines, and vivid colors, bringing to life stunning depictions of Hindu deities, mythological stories, and enchanting scenes from revered epics like the Ramayana and Mahabharata.",
    available: true,
  },
  {
    slug: "traditional-pattachitra-ii",
    purchaseCode: "KK-209",
    codeFromSite: false,
    title: "Traditional Pattachitra II",
    category: "Traditional Pattachitra",
    image: WIX + "62a063_53299dcdee96481380640a789628ee76~mv2.jpeg",
    priceCents: 19900,
    description:
      "Pattachitra is created not only for its beauty but also for its spiritual, religious, and cultural significance. The paintings help communicate religious teachings, tell sacred stories, express devotion to Hindu deities, and allow people to connect with their faith.",
    available: true,
  },
  {
    slug: "traditional-pattachitra-iii",
    purchaseCode: "KK-210",
    codeFromSite: false,
    title: "Traditional Pattachitra III",
    category: "Traditional Pattachitra",
    image: WIX + "62a063_30f96c7b0e7b42008b71d7954fd2c688~mv2.jpeg",
    priceCents: 16900,
    description:
      "Pattachitra holds deep spiritual significance in Hinduism, as it serves as a form of devotion and a visual way to connect with the divine. It is more than an art form; it is a sacred expression of bhakti (devotion).",
    available: true,
  },
  // Home page "Our Art Gallery" only — showInShop: false hides these from
  // /shop, the sitemap, and chatbot results. Titles/prices are placeholders;
  // replace with real values via a follow-up dev edit (title/category have
  // no admin override yet — see src/app/admin/page.tsx for what does).
  {
    slug: "traditional-pattachitra-iv",
    purchaseCode: "KK-211",
    codeFromSite: false,
    title: "Traditional Pattachitra IV",
    category: "Traditional Pattachitra",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/traditional-pattachitra-iv/seed.png",
    priceCents: 22500,
    description:
      "An intricately engraved Pattachitra piece, rich in traditional detail and ready to bring timeless character into any room.",
    available: true,
    showInShop: false,
  },
  {
    slug: "krsna-leelas-ii",
    purchaseCode: "KK-212",
    codeFromSite: false,
    title: "Krsna Leelas II",
    category: "Krsna Leelas",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/krsna-leelas-ii/seed.png",
    priceCents: 27500,
    description:
      "A vivid retelling of Krsna's leelas, framed and ready to bring the warmth of this cherished story into your home.",
    available: true,
    showInShop: false,
  },
  {
    slug: "traditional-pattachitra-v",
    purchaseCode: "KK-213",
    codeFromSite: false,
    title: "Traditional Pattachitra V",
    category: "Traditional Pattachitra",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/traditional-pattachitra-v/seed.png",
    priceCents: 22500,
    description:
      "An intricately engraved Pattachitra piece, rich in traditional detail and ready to bring timeless character into any room.",
    available: true,
    showInShop: false,
  },
  {
    slug: "uniquely-pattachitra-ii",
    purchaseCode: "KK-214",
    codeFromSite: false,
    title: "Uniquely Pattachitra II",
    category: "Uniquely Pattachitra",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/uniquely-pattachitra-ii/seed.png",
    priceCents: 25000,
    description:
      "A distinctive grouping of Pattachitra artworks, each piece a one-of-a-kind expression of this centuries-old tradition.",
    available: true,
    showInShop: false,
  },
  {
    slug: "traditional-pattachitra-vi",
    purchaseCode: "KK-215",
    codeFromSite: false,
    title: "Traditional Pattachitra VI",
    category: "Traditional Pattachitra",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/traditional-pattachitra-vi/seed.png",
    priceCents: 22500,
    description:
      "An intricately engraved Pattachitra piece, rich in traditional detail and ready to bring timeless character into any room.",
    available: true,
    showInShop: false,
  },
  {
    slug: "krsna-leelas-iii",
    purchaseCode: "KK-216",
    codeFromSite: false,
    title: "Krsna Leelas III",
    category: "Krsna Leelas",
    image: "https://hjowrfenzypgpqgsqbtl.supabase.co/storage/v1/object/public/product-images/krsna-leelas-iii/seed.png",
    priceCents: 27500,
    description:
      "A vivid retelling of Krsna's leelas, framed and ready to bring the warmth of this cherished story into your home.",
    available: true,
    showInShop: false,
  },
];

// Public-facing catalogue: every image is swapped for a stable `/img/{slug}`
// path. That route resolves to an admin-uploaded replacement if one exists
// in the database, falling back to the original image below otherwise —
// so admins can swap artwork photos from /admin without a code change.
export const products: Product[] = rawProducts.map((p) => ({ ...p, image: `/img/${p.slug}` }));

/** Shop-facing subset: excludes products marked showInShop: false (Home-page-only artworks). */
export const shopProducts: Product[] = products.filter((p) => p.showInShop !== false);

/** The original (non-overridable) image for a product, by slug. */
export function defaultProductImage(slug: string): string | undefined {
  return rawProducts.find((p) => p.slug === slug)?.image;
}

/** The original (non-overridable) price for a product, by slug. */
export function defaultProductPrice(slug: string): number | undefined {
  return rawProducts.find((p) => p.slug === slug)?.priceCents;
}

export const categories = Array.from(new Set(products.map((p) => p.category)));

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Find products by purchase code, tolerant of spacing ("gb 101", "GB-101"). */
export function findByCode(code: string): Product[] {
  const n = norm(code);
  return shopProducts.filter((p) => norm(p.purchaseCode) === n);
}

/** Wix CDN resize helper — keeps the original file, just requests a size. */
export function wixImage(url: string, w: number, h: number): string {
  if (!url.startsWith(WIX)) return url;
  const file = url.slice(WIX.length);
  return `${url}/v1/fill/w_${w},h_${h},al_c,q_80,enc_avif,quality_auto/${encodeURIComponent(file)}`;
}
