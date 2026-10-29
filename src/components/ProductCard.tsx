import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import InquireButton from "./InquireButton";

export default function ProductCard({
  product,
  priority = false,
  showActions = true,
}: {
  product: CatalogProduct;
  priority?: boolean;
  showActions?: boolean;
}) {
  const hasSizes = product.kind === "ART_FRAME" && product.sizes.length > 0;
  const fromPriceCents = hasSizes ? Math.min(...product.sizes.map((s) => s.priceCents)) : product.priceCents;
  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-shankh-dark">
        <Image
          src={product.image}
          alt={product.title}
          fill
          priority={priority}
          sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw"
          className="object-contain transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold tracking-wider text-maroon backdrop-blur">
          {product.purchaseCode}
        </span>
        {!product.available && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-shankh">Sold</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sindoor">{product.category}</p>
          <h3 className="mt-1 text-xl font-semibold leading-snug">
            <Link href={`/shop/${product.slug}`} className="hover:text-sindoor">
              {product.title}
            </Link>
          </h3>
        </div>
        {showActions && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-extrabold text-ink">
              {hasSizes ? `From ${formatMoney(fromPriceCents)}` : formatMoney(fromPriceCents)}
            </span>
            <InquireButton title={product.title} available={product.available} compact />
          </div>
        )}
      </div>
    </article>
  );
}
