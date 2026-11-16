"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/format";
import type { SizeOption } from "@/lib/pricing";
import { BagIcon } from "./Icons";

export default function SizeSelector({
  slug,
  available,
  sizes,
}: {
  slug: string;
  available: boolean;
  sizes: SizeOption[];
}) {
  const { add, openDrawer } = useCart();
  const [selected, setSelected] = useState(0);
  const size = sizes[selected];

  return (
    <div>
      <p className="mt-5 text-3xl font-extrabold text-ink">{formatMoney(size.priceCents)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sizes.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === selected}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              i === selected ? "border-maroon bg-maroon text-shankh" : "border-ink/15 bg-white text-ink-soft hover:border-maroon hover:text-maroon"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {available ? (
          <button
            type="button"
            onClick={() => {
              add(slug, 1, size.label);
              openDrawer();
            }}
            className="btn-primary h-12 w-full"
          >
            <BagIcon className="h-5 w-5" />
            Add to cart
          </button>
        ) : (
          <button type="button" disabled className="btn-outline w-full">
            Sold
          </button>
        )}
      </div>
    </div>
  );
}
