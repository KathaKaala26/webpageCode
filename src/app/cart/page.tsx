"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatMoney, shippingFor } from "@/lib/format";
import { QtyStepper } from "@/components/CartDrawer";
import { TrashIcon } from "@/components/Icons";

export default function CartPage() {
  const { lines, subtotalCents, remove, ready } = useCart();
  const shipping = shippingFor(subtotalCents);

  return (
    <section className="container-kk py-12 sm:py-16">
      <h1 className="text-4xl font-semibold sm:text-5xl">Your Cart</h1>

      {!ready ? (
        <div className="mt-10 h-40 animate-pulse rounded-2xl bg-white" />
      ) : lines.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-display text-2xl text-maroon">Your cart is empty</p>
          <Link href="/shop" className="btn-primary mt-6">
            Visit the shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <ul className="card divide-y divide-ink/10 lg:col-span-2">
            {lines.map(({ product, quantity, lineCents }) => (
              <li key={product.slug} className="flex gap-4 p-4 sm:p-5">
                <Link href={`/shop/${product.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-shankh-dark sm:h-32 sm:w-28">
                  <Image src={product.image} alt={product.title} fill sizes="112px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-wider text-sindoor">{product.purchaseCode}</p>
                      <Link href={`/shop/${product.slug}`} className="font-display text-xl font-semibold text-maroon hover:text-sindoor">
                        {product.title}
                      </Link>
                      <p className="text-sm text-ink-soft">{formatMoney(product.priceCents)} each</p>
                    </div>
                    <button type="button" onClick={() => remove(product.slug)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink/50 hover:bg-sindoor/10 hover:text-sindoor" aria-label={`Remove ${product.title}`}>
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <QtyStepper slug={product.slug} quantity={quantity} />
                    <span className="text-lg font-extrabold">{formatMoney(lineCents)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-24">
            <h2 className="text-2xl font-semibold">Summary</h2>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">{formatMoney(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg">
              <span className="font-bold">Total</span>
              <span className="font-extrabold">{formatMoney(subtotalCents + shipping)}</span>
            </div>
            <Link href="/checkout" className="btn-primary h-12 w-full">
              Proceed to checkout
            </Link>
            <Link href="/shop" className="block text-center text-sm font-semibold text-maroon hover:underline">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
