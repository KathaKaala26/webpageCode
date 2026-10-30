"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminCookieOptions, isAdmin, makeToken, passwordMatches } from "@/lib/admin";
import { baseCatalog, productExists } from "@/lib/pricing";
import { HOME_SECTIONS } from "@/lib/home";
import { PRODUCT_IMAGES_BUCKET, supabaseAdmin } from "@/lib/supabaseAdmin";

const PRODUCT_SECTIONS = ["SHOP", "PUJA_ESSENTIALS", "BOOKS"] as const;

const STATUSES = ["PENDING_PAYMENT", "PAID", "COD_PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

export async function login(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  const pw = String(fd.get("password") ?? "");
  if (!passwordMatches(pw)) return { error: "Incorrect password." };
  (await cookies()).set(ADMIN_COOKIE, makeToken(), adminCookieOptions);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}

export async function updateOrderStatus(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "") as Status;
  if (!id || !STATUSES.includes(status)) return;
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
}

export async function toggleEnquiry(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(fd.get("id") ?? "");
  const handled = fd.get("handled") === "true";
  if (!id) return;
  await prisma.enquiry.update({ where: { id }, data: { handled } });
  revalidatePath("/admin");
}

function revalidateCatalog(slug: string) {
  revalidatePath("/admin");
  revalidatePath(`/img/${slug}`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/puja-essentials");
  revalidatePath("/books");
  revalidatePath("/");
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadProductImage(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");

  const slug = String(fd.get("slug") ?? "");
  const file = fd.get("file");
  if (!(await productExists(slug))) return { error: "Unknown product." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file first." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5MB." };

  const ext = file.type.split("/")[1];
  const path = `${slug}/${Date.now()}.${ext}`;
  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  await prisma.productImage.upsert({
    where: { slug },
    create: { slug, url: data.publicUrl },
    update: { url: data.publicUrl },
  });

  revalidateCatalog(slug);
  return {};
}

export async function removeProductImage(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productImage.deleteMany({ where: { slug } });
  revalidateCatalog(slug);
}

export async function updateProductPrice(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const dollars = Number(String(fd.get("price") ?? "").trim());
  if (!Number.isFinite(dollars) || dollars <= 0) return { error: "Enter a valid price." };
  const priceCents = Math.round(dollars * 100);

  await prisma.productPrice.upsert({
    where: { slug },
    create: { slug, priceCents },
    update: { priceCents },
  });
  revalidateCatalog(slug);
  return {};
}

export async function removeProductPrice(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productPrice.deleteMany({ where: { slug } });
  revalidateCatalog(slug);
}

/** Clears every admin price override in one go — for undoing bulk test data (e.g. a batch of $0.01 prices). */
export async function removeAllProductPrices() {
  if (!(await isAdmin())) redirect("/admin");
  await prisma.productPrice.deleteMany({});
  revalidatePath("/", "layout");
}

const PRODUCT_KINDS = ["ART_FRAME", "HOME_DECOR"] as const;

export async function updateProductKind(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  const kind = String(fd.get("kind") ?? "");
  if (!PRODUCT_KINDS.includes(kind as (typeof PRODUCT_KINDS)[number]) || !(await productExists(slug))) return;
  await prisma.productKindOverride.upsert({
    where: { slug },
    create: { slug, kind: kind as (typeof PRODUCT_KINDS)[number] },
    update: { kind: kind as (typeof PRODUCT_KINDS)[number] },
  });
  revalidateCatalog(slug);
}

export async function updateProductAvailability(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  const available = fd.get("available") === "true";
  if (!(await productExists(slug))) return;
  await prisma.productAvailabilityOverride.upsert({
    where: { slug },
    create: { slug, available },
    update: { available },
  });
  revalidateCatalog(slug);
}

export async function addProductSize(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const label = String(fd.get("label") ?? "").trim();
  if (!label) return { error: "Enter a size label." };

  const dollars = Number(String(fd.get("price") ?? "").trim());
  if (!Number.isFinite(dollars) || dollars <= 0) return { error: "Enter a valid price." };
  const priceCents = Math.round(dollars * 100);

  try {
    await prisma.productSize.create({ data: { slug, label, priceCents } });
  } catch {
    return { error: `A size called "${label}" already exists for this product.` };
  }
  revalidateCatalog(slug);
  return {};
}

export async function removeProductSize(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  const label = String(fd.get("label") ?? "");
  if (!slug || !label) return;
  await prisma.productSize.deleteMany({ where: { slug, label } });
  revalidateCatalog(slug);
}

export async function updateProductDescription(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const description = String(fd.get("description") ?? "").trim();
  await prisma.productDescriptionOverride.upsert({
    where: { slug },
    create: { slug, description },
    update: { description },
  });
  revalidateCatalog(slug);
  return {};
}

export async function removeProductDescription(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productDescriptionOverride.deleteMany({ where: { slug } });
  revalidateCatalog(slug);
}

export async function updateProductTitle(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const title = String(fd.get("title") ?? "").trim();
  await prisma.productTitleOverride.upsert({
    where: { slug },
    create: { slug, title },
    update: { title },
  });
  revalidateCatalog(slug);
  return {};
}

export async function removeProductTitle(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productTitleOverride.deleteMany({ where: { slug } });
  revalidateCatalog(slug);
}

export async function updateHomeSections(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return;

  await Promise.all(
    HOME_SECTIONS.map(async (section) => {
      const checked = fd.get(`section_${section}`) === "on";
      if (!checked) {
        await prisma.homeSectionItem.deleteMany({ where: { slug, section } });
        return;
      }
      const position = Math.round(Number(String(fd.get(`order_${section}`) ?? "0").trim())) || 0;
      await prisma.homeSectionItem.upsert({
        where: { slug_section: { slug, section } },
        create: { slug, section, position },
        update: { position },
      });
    })
  );
  revalidatePath("/admin");
  revalidatePath("/");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

export async function createProduct(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");

  const title = String(fd.get("title") ?? "").trim();
  const category = String(fd.get("category") ?? "").trim();
  const section = String(fd.get("section") ?? "");
  const dollars = Number(String(fd.get("price") ?? "").trim());
  const file = fd.get("file");

  if (!title) return { error: "Enter a title." };
  if (!category) return { error: "Enter a category." };
  if (!PRODUCT_SECTIONS.includes(section as (typeof PRODUCT_SECTIONS)[number])) return { error: "Choose a section." };
  if (!Number.isFinite(dollars) || dollars <= 0) return { error: "Enter a valid price." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file first." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5MB." };

  const existing = new Set((await baseCatalog()).map((p) => p.slug));
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (existing.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  const purchaseCode = `KK-${randomBytes(3).toString("hex").toUpperCase()}`;

  const ext = file.type.split("/")[1];
  const path = `${slug}/${Date.now()}.${ext}`;
  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  await prisma.product.create({
    data: {
      slug,
      purchaseCode,
      title,
      category,
      section: section as (typeof PRODUCT_SECTIONS)[number],
      image: data.publicUrl,
      priceCents: Math.round(dollars * 100),
    },
  });

  revalidateCatalog(slug);
  return {};
}

export async function updateExchangeRate(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const rate = Number(String(fd.get("rate") ?? "").trim());
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Enter a valid rate." };
  await prisma.exchangeRate.upsert({
    where: { id: 1 },
    create: { id: 1, usdToGbp: rate },
    update: { usdToGbp: rate },
  });
  revalidatePath("/admin");
  return {};
}
