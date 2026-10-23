import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultProductImage } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const override = await prisma.productImage.findUnique({ where: { slug } });
  const url = override?.url ?? defaultProductImage(slug);
  if (!url) return new NextResponse("Not found", { status: 404 });

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Image unavailable", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600",
    },
  });
}
