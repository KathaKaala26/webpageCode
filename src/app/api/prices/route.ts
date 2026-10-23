import { NextResponse } from "next/server";
import { priceOverrides } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const overrides = await priceOverrides();
  return NextResponse.json(Object.fromEntries(overrides), {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=300" },
  });
}
