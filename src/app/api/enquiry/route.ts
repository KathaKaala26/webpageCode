import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEnquiryNotification } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Very small in-memory rate limit (per server instance) to deter spam.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many messages — please try again later." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const name = s(body.name, 120);
  const email = s(body.email, 160).toLowerCase();
  const message = s(body.message, 4000);
  const page = s(body.page, 200) || null;
  if (s(body.website, 100)) return NextResponse.json({ ok: true }); // honeypot

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please add your name, a valid email and a message." }, { status: 400 });
  }

  try {
    await prisma.enquiry.create({ data: { name, email, message, page } });
  } catch (e) {
    console.error("[enquiry]", e);
    return NextResponse.json({ error: "Couldn't send right now. Please try again." }, { status: 500 });
  }

  try {
    await sendEnquiryNotification({ name, email, message, page });
  } catch (e) {
    console.error("[enquiry:email]", e);
  }

  return NextResponse.json({ ok: true });
}
