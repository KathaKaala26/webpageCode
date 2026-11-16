"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { commerce } from "@/lib/site";
import { useCartCatalog } from "@/lib/useCartCatalog";

type StoredItem = { slug: string; sizeLabel?: string; quantity: number };
export type CartLine = {
  slug: string;
  sizeLabel?: string;
  title: string;
  image: string;
  purchaseCode: string;
  available: boolean;
  quantity: number;
  lineCents: number;
};

type CartCtx = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (slug: string, qty?: number, sizeLabel?: string) => void;
  setQty: (slug: string, qty: number, sizeLabel?: string) => void;
  remove: (slug: string, sizeLabel?: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "kk_cart_v1";

const lineKey = (slug: string, sizeLabel?: string) => `${slug}::${sizeLabel ?? ""}`;

function load(): StoredItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && typeof i.slug === "string" && i.quantity > 0 && (i.sizeLabel === undefined || typeof i.sizeLabel === "string"))
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const catalog = useCartCatalog();

  useEffect(() => {
    setItems(load());
    setReady(true);
    // Keep the cart in sync across tabs / the installed PWA window.
    const onStorage = (e: StorageEvent) => e.key === KEY && setItems(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — cart still works for this visit */
    }
  }, [items, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const clampQty = (q: number) => Math.max(0, Math.min(commerce.maxQtyPerItem, Math.floor(q)));

  const add = useCallback(
    (slug: string, qty = 1, sizeLabel?: string) => {
      const key = lineKey(slug, sizeLabel);
      setItems((prev) => {
        const found = prev.find((i) => lineKey(i.slug, i.sizeLabel) === key);
        if (found) return prev.map((i) => (lineKey(i.slug, i.sizeLabel) === key ? { ...i, quantity: clampQty(i.quantity + qty) } : i));
        return [...prev, { slug, sizeLabel, quantity: clampQty(qty) }];
      });
      const p = catalog[slug];
      setToast(p ? `Added "${p.title}" to your cart` : "Added to your cart");
    },
    [catalog],
  );

  const setQty = useCallback((slug: string, qty: number, sizeLabel?: string) => {
    const q = clampQty(qty);
    const key = lineKey(slug, sizeLabel);
    setItems((prev) =>
      q === 0 ? prev.filter((i) => lineKey(i.slug, i.sizeLabel) !== key) : prev.map((i) => (lineKey(i.slug, i.sizeLabel) === key ? { ...i, quantity: q } : i)),
    );
  }, []);

  const remove = useCallback((slug: string, sizeLabel?: string) => {
    const key = lineKey(slug, sizeLabel);
    setItems((prev) => prev.filter((i) => lineKey(i.slug, i.sizeLabel) !== key));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo<CartLine[]>(
    () =>
      items.flatMap((i) => {
        const p = catalog[i.slug];
        if (!p) return [];
        let priceCents = p.priceCents;
        if (i.sizeLabel) {
          const size = p.sizes.find((s) => s.label === i.sizeLabel);
          if (!size) return [];
          priceCents = size.priceCents;
        }
        return [
          {
            slug: i.slug,
            sizeLabel: i.sizeLabel,
            title: p.title,
            image: p.image,
            purchaseCode: p.purchaseCode,
            available: p.available,
            quantity: i.quantity,
            lineCents: priceCents * i.quantity,
          },
        ];
      }),
    [items, catalog],
  );

  const value: CartCtx = {
    ready,
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotalCents: lines.reduce((s, l) => s + l.lineCents, 0),
    add,
    setQty,
    remove,
    clear,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
