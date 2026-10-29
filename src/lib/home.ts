import { prisma } from "./prisma";
import type { CatalogProduct } from "./pricing";

export const HOME_SECTIONS = ["GALLERY", "PALM_LEAF", "COLORFUL", "ADDITIONAL"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export const HOME_SECTION_LABEL: Record<HomeSection, string> = {
  GALLERY: "Our Art Gallery",
  PALM_LEAF: "Palm Leaf Pattachitra",
  COLORFUL: "Colorful Pattachitra",
  ADDITIONAL: "Additional Products",
};

/** Today's hardcoded picks — used whenever a section has no admin-configured rows. */
export const HOME_SECTION_DEFAULTS: Record<HomeSection, string[]> = {
  GALLERY: ["krsna-leelas", "stories-of-life", "small-art-decor"],
  PALM_LEAF: ["palm-leaf-gb101", "palm-leaf-kn14", "palm-leaf-gb-101"],
  COLORFUL: ["colorful-hd105", "colorful-rhc150"],
  ADDITIONAL: ["palm-leaf-gb-101", "abstract-and-colorful"],
};

/** The 4 Home page sections, each resolved to an ordered list of catalogue products. */
export async function homeSections(priced: CatalogProduct[]): Promise<Record<HomeSection, CatalogProduct[]>> {
  const rows = await prisma.homeSectionItem.findMany({ orderBy: { position: "asc" } });
  const bySlug = new Map(priced.map((p) => [p.slug, p]));

  const result = {} as Record<HomeSection, CatalogProduct[]>;
  for (const section of HOME_SECTIONS) {
    const configured = rows.filter((r) => r.section === section).map((r) => r.slug);
    const slugs = configured.length > 0 ? configured : HOME_SECTION_DEFAULTS[section];
    result[section] = slugs.map((s) => bySlug.get(s)).filter((p): p is CatalogProduct => Boolean(p));
  }
  return result;
}

/** slug -> { section: position } for every HomeSectionItem row — used to pre-fill the admin form. */
export async function homeSectionMembership(): Promise<Map<string, Partial<Record<HomeSection, number>>>> {
  const rows = await prisma.homeSectionItem.findMany();
  const map = new Map<string, Partial<Record<HomeSection, number>>>();
  for (const r of rows) {
    const entry = map.get(r.slug) ?? {};
    entry[r.section as HomeSection] = r.position;
    map.set(r.slug, entry);
  }
  return map;
}
