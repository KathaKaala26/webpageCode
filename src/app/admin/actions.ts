"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminCookieOptions, isAdmin, makeToken, passwordMatches } from "@/lib/admin";

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
