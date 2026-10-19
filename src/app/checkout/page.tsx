"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { formatMoney, shippingFor } from "@/lib/format";
import { commerce } from "@/lib/site";
import { CardIcon, LockIcon, TruckIcon } from "@/components/Icons";

type Method = "STRIPE" | "COD";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotalCents, ready, clear } = useCart();
  const [method, setMethod] = useState<Method>("STRIPE");
  const [country, setCountry] = useState<string>(commerce.shipCountries[0].code);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("cancelled"))
      setError("Payment was cancelled — nothing was charged. Your cart is saved, so you can try again or choose cash on delivery.");
  }, []);

  const codAllowed = (commerce.codCountries as readonly string[]).includes(country);
  const effectiveMethod: Method = method === "COD" && !codAllowed ? "STRIPE" : method;
  const shipping = shippingFor(subtotalCents);
  const codFee = effectiveMethod === "COD" ? commerce.codFeeCents : 0;
  const total = subtotalCents + shipping + codFee;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!navigator.onLine) {
      setError("You appear to be offline. Please reconnect to place your order.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const customer = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: effectiveMethod,
          customer,
          items: lines.map((l) => ({ slug: l.product.slug, quantity: l.quantity })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; orderId?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (data.url) {
        window.location.href = data.url; // Stripe-hosted payment page
        return;
      }
      if (data.orderId) {
        clear();
        router.push(`/order/success?order=${encodeURIComponent(data.orderId)}`);
        return;
      }
      throw new Error("Unexpected response. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (!ready) return <div className="container-kk py-16"><div className="h-64 animate-pulse rounded-2xl bg-white" /></div>;

  if (lines.length === 0)
    return (
      <section className="container-kk py-20 text-center">
        <h1 className="text-4xl font-semibold">Checkout</h1>
        <p className="mt-4 text-ink-soft">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Visit the shop
        </Link>
      </section>
    );

  return (
    <section className="container-kk py-10 sm:py-14">
      <h1 className="text-4xl font-semibold sm:text-5xl">Checkout</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-5" noValidate={false}>
        <div className="space-y-8 lg:col-span-3">
          {/* Contact */}
          <fieldset className="card space-y-4 p-5 sm:p-6">
            <legend className="float-left mb-2 w-full font-display text-2xl font-semibold text-maroon">Contact</legend>
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" required autoComplete="name" className="field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone</label>
                <input id="phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" className="field" />
              </div>
            </div>
          </fieldset>

          {/* Shipping */}
          <fieldset className="card space-y-4 p-5 sm:p-6">
            <legend className="float-left mb-2 w-full font-display text-2xl font-semibold text-maroon">Delivery address</legend>
            <div>
              <label htmlFor="country" className="label">Country</label>
              <select id="country" name="country" required autoComplete="country" className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
                {commerce.shipCountries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="addressLine1" className="label">Address</label>
              <input id="addressLine1" name="addressLine1" required autoComplete="address-line1" className="field" />
            </div>
            <div>
              <label htmlFor="addressLine2" className="label">Apartment, suite, etc. <span className="font-normal text-ink/50">(optional)</span></label>
              <input id="addressLine2" name="addressLine2" autoComplete="address-line2" className="field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="city" className="label">City</label>
                <input id="city" name="city" required autoComplete="address-level2" className="field" />
              </div>
              <div>
                <label htmlFor="region" className="label">{country === "CA" ? "Province" : "State"}</label>
                <input id="region" name="region" required autoComplete="address-level1" className="field" />
              </div>
              <div>
                <label htmlFor="postalCode" className="label">{country === "CA" ? "Postal code" : "ZIP code"}</label>
                <input id="postalCode" name="postalCode" required autoComplete="postal-code" className="field" />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="label">Order notes <span className="font-normal text-ink/50">(optional)</span></label>
              <textarea id="notes" name="notes" rows={3} className="field" placeholder="Gift message, delivery instructions…" />
            </div>
          </fieldset>

          {/* Payment */}
          <fieldset className="card space-y-3 p-5 sm:p-6">
            <legend className="float-left mb-2 w-full font-display text-2xl font-semibold text-maroon">Payment</legend>
            <PayOption
              checked={effectiveMethod === "STRIPE"}
              onChange={() => setMethod("STRIPE")}
              icon={<CardIcon className="h-6 w-6" />}
              title="Pay by card"
              text="Visa, Mastercard, Amex, Apple Pay & Google Pay — processed securely by Stripe."
            />
            <PayOption
              checked={effectiveMethod === "COD"}
              disabled={!codAllowed}
              onChange={() => setMethod("COD")}
              icon={<TruckIcon className="h-6 w-6" />}
              title="Cash on delivery"
              text={
                codAllowed
                  ? `Pay in cash when your artwork arrives.${commerce.codFeeCents ? ` A ${formatMoney(commerce.codFeeCents)} handling fee applies.` : ""}`
                  : "Not available for this country."
              }
            />
          </fieldset>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2">
          <div className="card space-y-4 p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-2xl font-semibold">Order summary</h2>
            <ul className="divide-y divide-ink/10">
              {lines.map(({ product, quantity, lineCents }) => (
                <li key={product.slug} className="flex items-center gap-3 py-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-shankh-dark">
                    <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-maroon px-1 text-[11px] font-bold text-white">{quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.title}</p>
                    <p className="text-xs text-ink-soft">{product.purchaseCode}</p>
                  </div>
                  <span className="text-sm font-bold">{formatMoney(lineCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{formatMoney(subtotalCents)}</dd></div>
              <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping)}</dd></div>
              {codFee > 0 && <div className="flex justify-between text-ink-soft"><dt>COD handling</dt><dd>{formatMoney(codFee)}</dd></div>}
              <div className="flex justify-between border-t border-ink/10 pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatMoney(total)}</dd></div>
            </dl>

            {error && <p role="alert" className="rounded-lg bg-sindoor/10 px-3 py-2 text-sm font-semibold text-sindoor-dark">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary h-14 w-full text-base">
              {submitting ? "Please wait…" : effectiveMethod === "STRIPE" ? <><LockIcon /> Pay {formatMoney(total)}</> : `Place order · ${formatMoney(total)}`}
            </button>
            <p className="text-center text-xs text-ink-soft">
              {effectiveMethod === "STRIPE" ? "You'll be taken to Stripe's secure page to pay." : "We'll email you a confirmation. Pay in cash on delivery."}
            </p>
          </div>
        </aside>
      </form>
    </section>
  );
}

function PayOption({
  checked,
  disabled,
  onChange,
  icon,
  title,
  text,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${
        checked ? "border-sindoor bg-sindoor/5" : "border-ink/10 hover:border-ink/25"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input type="radio" name="paymentMethod" className="mt-1 h-5 w-5 accent-[#B5261E]" checked={checked} disabled={disabled} onChange={onChange} />
      <span className="text-sindoor">{icon}</span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-ink-soft">{text}</span>
      </span>
    </label>
  );
}
