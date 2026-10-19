import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "kk_admin";
const MAX_AGE_S = 60 * 60 * 12; // 12 hours

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_SESSION_SECRET / ADMIN_PASSWORD not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeToken(): string {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function passwordMatches(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(createHmac("sha256", "kk").update(input).digest("hex"));
  const b = Buffer.from(createHmac("sha256", "kk").update(real).digest("hex"));
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  try {
    return verifyToken(store.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_S,
};
