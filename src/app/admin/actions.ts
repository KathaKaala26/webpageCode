"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminCookieOptions, isAdmin, makeToken, passwordMatches } from "@/lib/admin";
import { getProduct } from "@/lib/products";
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

  revalidatePath("/admin");
  revalidatePath(`/img/${slug}`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/");
  return {};
}

export async function removeProductImage(fd: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await prisma.productImage.deleteMany({ where: { slug } });
  revalidatePath("/admin");
  revalidatePath(`/img/${slug}`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/");
}
