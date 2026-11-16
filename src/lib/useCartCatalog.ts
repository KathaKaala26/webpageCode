"use client";

import { useEffect, useState } from "react";
import type { ProductKind, SizeOption } from "./pricing";

export type CartCatalogEntry = {
  title: string;
  image: string;
  purchaseCode: string;
  priceCents: number;
  available: boolean;
  kind: ProductKind;
  sizes: SizeOption[];
};

/** slug -> full catalog entry (static + admin-created products, with sizes), fetched from /api/cart-catalog. */
export function useCartCatalog(): Record<string, CartCatalogEntry> {
  const [catalog, setCatalog] = useState<Record<string, CartCatalogEntry>>({});
  useEffect(() => {
    let alive = true;
    fetch("/api/cart-catalog")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => alive && setCatalog(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return catalog;
}
