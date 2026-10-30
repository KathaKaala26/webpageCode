"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminCookieOptions, isAdmin, makeToken, passwordMatches } from "@/lib/admin";
import { getProduct } from "@/lib/products";
import { HOME_SECTIONS } from "@/lib/home";
import { PRODUCT_IMAGES_BUCKET, supabaseAdmin } from "@/lib/supabaseAdmin";

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
  revalidatePath("/");
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadProductImage(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");

  const slug = String(fd.get("slug") ?? "");
  const file = fd.get("file");
  if (!getProduct(slug)) return { error: "Unknown product." };
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
  const product = getProduct(slug);
  if (!product) return { error: "Unknown product." };

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
  if (!getProduct(slug) || !PRODUCT_KINDS.includes(kind as (typeof PRODUCT_KINDS)[number])) return;
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
  if (!getProduct(slug)) return;
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
  const product = getProduct(slug);
  if (!product) return { error: "Unknown product." };

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
  if (!getProduct(slug)) return { error: "Unknown product." };

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
  if (!getProduct(slug)) return { error: "Unknown product." };

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
  if (!getProduct(slug)) return;

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
