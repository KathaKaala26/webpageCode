import { NextResponse } from "next/server";
import { pricedProducts } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await pricedProducts();
  const catalog = Object.fromEntries(
    products.map((p) => [
      p.slug,
      {
        title: p.title,
        image: p.image,
        purchaseCode: p.purchaseCode,
        priceCents: p.priceCents,
        available: p.available,
        kind: p.kind,
        sizes: p.sizes,
      },
    ]),
  );
  return NextResponse.json(catalog, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=300" },
  });
}
