import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultProductImage, wixImage } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const cachedImageOverride = unstable_cache(
  (slug: string) => prisma.productImage.findUnique({ where: { slug } }),
  ["catalog:product-image"],
  { tags: ["catalog"], revalidate: 3600 }
);

const cachedCreatedProductImage = unstable_cache(
  (slug: string) => prisma.product.findUnique({ where: { slug }, select: { image: true } }),
  ["catalog:created-product-image"],
  { tags: ["catalog"], revalidate: 3600 }
);

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const override = await cachedImageOverride(slug);
  let url = override?.url ?? defaultProductImage(slug);
  if (!url) {
    // Not a static catalogue slug — check the admin-created Product table.
    const created = await cachedCreatedProductImage(slug);
    url = created?.image;
  }
  if (!url) return new NextResponse("Not found", { status: 404 });

  const upstream = await fetch(wixImage(url, 2000, 2000), { next: { revalidate: 86400, tags: ["catalog"] } });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Image unavailable", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
