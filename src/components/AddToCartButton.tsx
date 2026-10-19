"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { commerce } from "@/lib/site";
import { BagIcon } from "./Icons";

export default function AddToCartButton({
  slug,
  available,
  compact = false,
  withQty = false,
}: {
  slug: string;
  available: boolean;
  compact?: boolean;
  withQty?: boolean;
}) {
  const { add, openDrawer } = useCart();
  const [qty, setQty] = useState(1);

  if (!available) {
    return (
      <button type="button" disabled className={compact ? "btn-outline px-4" : "btn-outline w-full"}>
        Sold
      </button>
    );
  }

  if (compact) {
    return (
      <button type="button" onClick={() => add(slug)} className="btn-primary px-4" aria-label="Add to cart">
        <BagIcon className="h-4 w-4" />
        Add
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {withQty && (
        <div className="flex h-12 items-center rounded-full border-2 border-maroon/20 bg-white" role="group" aria-label="Quantity">
          <button type="button" className="h-full w-12 text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
            −
          </button>
          <span className="w-8 text-center font-bold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="h-full w-12 text-xl"
            onClick={() => setQty((q) => Math.min(commerce.maxQtyPerItem, q + 1))}
            aria-label="Increase"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          add(slug, qty);
          openDrawer();
        }}
        className="btn-primary h-12 flex-1"
      >
        <BagIcon className="h-5 w-5" />
        Add to cart
      </button>
    </div>
  );
}
