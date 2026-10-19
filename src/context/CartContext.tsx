"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct, type Product } from "@/lib/products";
import { commerce } from "@/lib/site";

type StoredItem = { slug: string; quantity: number };
export type CartLine = { product: Product; quantity: number; lineCents: number };

type CartCtx = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toast: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "kk_cart_v1";

function load(): StoredItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.slug === "string" && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const add = useCallback((slug: string, qty = 1) => {
    const p = getProduct(slug);
    if (!p || !p.available) return;
    setItems((prev) => {
      const found = prev.find((i) => i.slug === slug);
      if (found) return prev.map((i) => (i.slug === slug ? { ...i, quantity: clampQty(i.quantity + qty) } : i));
      return [...prev, { slug, quantity: clampQty(qty) }];
    });
    setToast(`Added “${p.title}” to your cart`);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const q = clampQty(qty);
    setItems((prev) => (q === 0 ? prev.filter((i) => i.slug !== slug) : prev.map((i) => (i.slug === slug ? { ...i, quantity: q } : i))));
  }, []);

  const remove = useCallback((slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug)), []);
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo<CartLine[]>(
    () =>
      items.flatMap((i) => {
        const product = getProduct(i.slug);
        return product ? [{ product, quantity: i.quantity, lineCents: product.priceCents * i.quantity }] : [];
      }),
    [items],
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
