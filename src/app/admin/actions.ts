"use server";

import { randomBytes } from "crypto";
import sharp from "sharp";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminCookieOptions, isAdmin, makeToken, passwordMatches } from "@/lib/admin";
import { baseCatalog, productExists } from "@/lib/pricing";
import { HOME_SECTIONS } from "@/lib/home";
import { PRODUCT_IMAGES_BUCKET, VIDEOS_BUCKET, supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseYoutubeId } from "@/lib/video";

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
  updateTag("catalog");
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

// Wix's own CDN resizes/compresses every original catalogue image (see wixImage() in
// lib/products.ts) — admin uploads get no such treatment unless we do it ourselves here, so
// large phone-camera photos were being served at full original size. Match Wix's 2000px cap
// and re-encode to WebP so every upload stays small automatically.
const MAX_IMAGE_DIMENSION = 2000;

async function compressImage(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  const buffer = await sharp(input)
    .rotate()
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return { buffer, contentType: "image/webp", ext: "webp" };
}

export async function uploadProductImage(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");

  const slug = String(fd.get("slug") ?? "");
  const file = fd.get("file");
  if (!(await productExists(slug))) return { error: "Unknown product." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file first." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5MB." };

  const { buffer, contentType, ext } = await compressImage(file);
  const path = `${slug}/${Date.now()}.${ext}`;
  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, buffer, { contentType });
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

const VIDEO_TYPES = ["video/mp4", "video/webm"];
// Matches the Supabase project's bucket-level file-size limit (its plan's global max upload
// size) — raising this app-side without also raising the bucket's own limit would just move
// the rejection from here to a less helpful Supabase storage error.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// Video files are too large to route through a Server Action (a Vercel serverless function) —
// unlike uploadProductImage, the browser uploads the bytes straight to Supabase Storage using
// a short-lived signed URL minted here, and only the resulting path/URL ever touches Prisma.
export async function createProductVideoUploadUrl(args: {
  slug: string;
  contentType: string;
  size: number;
}): Promise<{ path: string; token: string; bucket: string } | { error: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const { slug, contentType, size } = args;
  if (!(await productExists(slug))) return { error: "Unknown product." };
  if (!VIDEO_TYPES.includes(contentType)) return { error: "Use an MP4 or WebM video." };
  if (size > MAX_VIDEO_BYTES) return { error: "Video must be under 50MB." };

  const ext = contentType.split("/")[1];
  const path = `product/${slug}/${Date.now()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(VIDEOS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: `Could not start upload: ${error?.message ?? "unknown error"}` };
  return { path, token: data.token, bucket: VIDEOS_BUCKET };
}

export async function confirmProductVideoUpload(args: { slug: string; path: string }): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const { slug, path } = args;
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const supabase = supabaseAdmin();
  const { error: verifyError } = await supabase.storage.from(VIDEOS_BUCKET).createSignedUrl(path, 60);
  if (verifyError) return { error: "Upload didn't complete — try again." };

  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path);
  const previous = await prisma.productVideo.findUnique({ where: { slug } });

  await prisma.productVideo.upsert({
    where: { slug },
    create: { slug, source: "UPLOAD", url: data.publicUrl, storagePath: path },
    update: { source: "UPLOAD", url: data.publicUrl, storagePath: path, youtubeId: null },
  });

  if (previous?.source === "UPLOAD" && previous.storagePath) {
    await supabase.storage.from(VIDEOS_BUCKET).remove([previous.storagePath]);
  }

  revalidateCatalog(slug);
  return {};
}

export async function setProductVideoYoutube(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return { error: "Unknown product." };

  const youtubeId = parseYoutubeId(String(fd.get("youtubeUrl") ?? ""));
  if (!youtubeId) return { error: "Paste a valid YouTube link." };

  const previous = await prisma.productVideo.findUnique({ where: { slug } });
  if (previous?.source === "UPLOAD" && previous.storagePath) {
    await supabaseAdmin().storage.from(VIDEOS_BUCKET).remove([previous.storagePath]);
  }

  await prisma.productVideo.upsert({
    where: { slug },
    create: { slug, source: "YOUTUBE", youtubeId },
    update: { source: "YOUTUBE", youtubeId, url: null, storagePath: null },
  });
  revalidateCatalog(slug);
  return {};
}

export async function removeProductVideo(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  const existing = await prisma.productVideo.findUnique({ where: { slug } });
  if (existing?.source === "UPLOAD" && existing.storagePath) {
    await supabaseAdmin().storage.from(VIDEOS_BUCKET).remove([existing.storagePath]);
  }
  await prisma.productVideo.deleteMany({ where: { slug } });
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
  updateTag("catalog");
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

export async function hideProduct(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!(await productExists(slug))) return;
  await prisma.productVisibilityOverride.upsert({
    where: { slug },
    create: { slug, hidden: true },
    update: { hidden: true },
  });
  revalidateCatalog(slug);
}

export async function restoreProduct(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productVisibilityOverride.deleteMany({ where: { slug } });
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
  updateTag("catalog");
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

  const { buffer, contentType, ext } = await compressImage(file);
  const path = `${slug}/${Date.now()}.${ext}`;
  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, buffer, { contentType });
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

function revalidateSiteVideo() {
  updateTag("catalog");
  revalidatePath("/admin");
  revalidatePath("/more-about-us");
}

export async function createSiteVideoUploadUrl(args: {
  contentType: string;
  size: number;
}): Promise<{ path: string; token: string; bucket: string } | { error: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const { contentType, size } = args;
  if (!VIDEO_TYPES.includes(contentType)) return { error: "Use an MP4 or WebM video." };
  if (size > MAX_VIDEO_BYTES) return { error: "Video must be under 50MB." };

  const ext = contentType.split("/")[1];
  const path = `site/${Date.now()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(VIDEOS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: `Could not start upload: ${error?.message ?? "unknown error"}` };
  return { path, token: data.token, bucket: VIDEOS_BUCKET };
}

export async function confirmSiteVideoUpload(args: { path: string }): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const { path } = args;

  const supabase = supabaseAdmin();
  const { error: verifyError } = await supabase.storage.from(VIDEOS_BUCKET).createSignedUrl(path, 60);
  if (verifyError) return { error: "Upload didn't complete — try again." };

  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path);
  const previous = await prisma.siteVideo.findUnique({ where: { id: 1 } });

  await prisma.siteVideo.upsert({
    where: { id: 1 },
    create: { id: 1, source: "UPLOAD", url: data.publicUrl, storagePath: path },
    update: { source: "UPLOAD", url: data.publicUrl, storagePath: path, youtubeId: null },
  });

  if (previous?.source === "UPLOAD" && previous.storagePath) {
    await supabase.storage.from(VIDEOS_BUCKET).remove([previous.storagePath]);
  }

  revalidateSiteVideo();
  return {};
}

export async function setSiteVideoYoutube(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  if (!(await isAdmin())) redirect("/admin");
  const youtubeId = parseYoutubeId(String(fd.get("youtubeUrl") ?? ""));
  if (!youtubeId) return { error: "Paste a valid YouTube link." };

  const previous = await prisma.siteVideo.findUnique({ where: { id: 1 } });
  if (previous?.source === "UPLOAD" && previous.storagePath) {
    await supabaseAdmin().storage.from(VIDEOS_BUCKET).remove([previous.storagePath]);
  }

  await prisma.siteVideo.upsert({
    where: { id: 1 },
    create: { id: 1, source: "YOUTUBE", youtubeId },
    update: { source: "YOUTUBE", youtubeId, url: null, storagePath: null },
  });
  revalidateSiteVideo();
  return {};
}

export async function removeSiteVideo() {
  if (!(await isAdmin())) redirect("/admin");
  const existing = await prisma.siteVideo.findUnique({ where: { id: 1 } });
  if (existing?.source === "UPLOAD" && existing.storagePath) {
    await supabaseAdmin().storage.from(VIDEOS_BUCKET).remove([existing.storagePath]);
  }
  await prisma.siteVideo.deleteMany({ where: { id: 1 } });
  revalidateSiteVideo();
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
