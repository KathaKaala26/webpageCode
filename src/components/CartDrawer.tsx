"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatMoney, shippingFor } from "@/lib/format";
import { commerce } from "@/lib/site";
import { CloseIcon, TrashIcon } from "./Icons";

export function QtyStepper({ slug, quantity }: { slug: string; quantity: number }) {
  const { setQty } = useCart();
  return (
    <div className="flex h-9 items-center rounded-full border border-ink/15 bg-white" role="group" aria-label="Quantity">
      <button type="button" className="h-full w-9 text-lg" onClick={() => setQty(slug, quantity - 1)} aria-label="Decrease quantity">
        −
      </button>
      <span className="w-6 text-center text-sm font-bold">{quantity}</span>
      <button
        type="button"
        className="h-full w-9 text-lg disabled:opacity-30"
        disabled={quantity >= commerce.maxQtyPerItem}
        onClick={() => setQty(slug, quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, subtotalCents, remove } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  const shipping = shippingFor(subtotalCents);
  const toFree = commerce.freeShippingThresholdCents - subtotalCents;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-ink/60 transition-opacity ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeDrawer}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-shankh shadow-2xl transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-center justify-between bg-maroon px-5 text-shankh">
          <h2 className="font-display text-2xl text-shankh">Your Cart</h2>
          <button type="button" onClick={closeDrawer} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>
        <div className="patta-band-thin" />

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-display text-2xl text-maroon">Your cart is empty</p>
            <p className="text-sm text-ink-soft">Browse our Pattachitra and palm-leaf artworks.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">
              Visit the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {lines.map(({ product, quantity, lineCents }) => (
                <li key={product.slug} className="flex gap-4 py-4">
                  <Link href={`/shop/${product.slug}`} onClick={closeDrawer} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-shankh-dark">
                    <Image src={product.image} alt={product.title} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[11px] font-bold tracking-wider text-sindoor">{product.purchaseCode}</p>
                    <p className="truncate font-display text-lg font-semibold text-maroon">{product.title}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QtyStepper slug={product.slug} quantity={quantity} />
                      <span className="font-bold">{formatMoney(lineCents)}</span>
                      <button type="button" onClick={() => remove(product.slug)} className="grid h-9 w-9 place-items-center rounded-full text-ink/50 hover:bg-sindoor/10 hover:text-sindoor" aria-label={`Remove ${product.title}`}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-ink/10 bg-white p-5">
              {commerce.freeShippingThresholdCents > 0 && toFree > 0 && (
                <p className="rounded-lg bg-haldi-pale px-3 py-2 text-xs font-semibold text-maroon">
                  Add {formatMoney(toFree)} more for free shipping
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-bold">{formatMoney(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
              </div>
              <Link href="/checkout" onClick={closeDrawer} className="btn-primary h-12 w-full">
                Checkout · {formatMoney(subtotalCents + shipping)}
              </Link>
              <Link href="/cart" onClick={closeDrawer} className="block text-center text-sm font-semibold text-maroon underline-offset-4 hover:underline">
                View full cart
              </Link>
              <p className="text-center text-xs text-ink-soft">Pay by card (Stripe) or cash on delivery</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
