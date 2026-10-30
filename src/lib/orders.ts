import { randomBytes } from "crypto";
import { commerce } from "./site";
import { shippingFor } from "./format";
import { pricedProduct, type CatalogProduct } from "./pricing";

export type CheckoutItemInput = { slug: string; quantity: number };

export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes?: string;
};

export type PricedLine = { product: CatalogProduct; quantity: number; lineCents: number };

export type PricedOrder = {
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  codFeeCents: number;
  totalCents: number;
};

export class CheckoutError extends Error {}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseCustomer(raw: unknown): CustomerInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const c: CustomerInput = {
    name: str(r.name, 120),
    email: str(r.email, 160).toLowerCase(),
    phone: str(r.phone, 40),
    addressLine1: str(r.addressLine1),
    addressLine2: str(r.addressLine2) || undefined,
    city: str(r.city, 100),
    region: str(r.region, 100),
    postalCode: str(r.postalCode, 20),
    country: str(r.country, 2).toUpperCase(),
    notes: str(r.notes, 1000) || undefined,
  };
  const missing = (["name", "email", "phone", "addressLine1", "city", "region", "postalCode", "country"] as const).filter(
    (k) => !c[k],
  );
  if (missing.length) throw new CheckoutError(`Please fill in: ${missing.join(", ")}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new CheckoutError("Please enter a valid email address.");
  if (c.phone.replace(/\D/g, "").length < 7) throw new CheckoutError("Please enter a valid phone number.");
  if (!commerce.shipCountries.some((x) => x.code === c.country))
    throw new CheckoutError("Sorry, we don't ship to that country yet.");
  return c;
}

/** Prices are always recomputed on the server from the catalogue (plus any
 *  admin price override) — the browser only sends slugs and quantities. */
export async function priceItems(raw: unknown, paymentMethod: "STRIPE" | "COD"): Promise<PricedOrder> {
  if (!Array.isArray(raw) || raw.length === 0) throw new CheckoutError("Your cart is empty.");
  const merged = new Map<string, number>();
  for (const it of raw as CheckoutItemInput[]) {
    const slug = typeof it?.slug === "string" ? it.slug : "";
    const q = Math.floor(Number(it?.quantity));
    if (!slug || !Number.isFinite(q) || q < 1) continue;
    merged.set(slug, Math.min((merged.get(slug) ?? 0) + q, commerce.maxQtyPerItem));
  }
  const lines: PricedLine[] = [];
  for (const [slug, quantity] of merged) {
    const product = await pricedProduct(slug);
    if (!product) throw new CheckoutError("An item in your cart is no longer available.");
    if (!product.available) throw new CheckoutError(`"${product.title}" has just sold out.`);
    lines.push({ product, quantity, lineCents: product.priceCents * quantity });
  }
  if (!lines.length) throw new CheckoutError("Your cart is empty.");
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const shippingCents = shippingFor(subtotalCents);
  const codFeeCents = paymentMethod === "COD" ? commerce.codFeeCents : 0;
  return { lines, subtotalCents, shippingCents, codFeeCents, totalCents: subtotalCents + shippingCents + codFeeCents };
}

export function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KK-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function orderData(customer: CustomerInput, priced: PricedOrder) {
  return {
    customerName: customer.name,
    email: customer.email,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2 ?? null,
    city: customer.city,
    region: customer.region,
    postalCode: customer.postalCode,
    country: customer.country,
    notes: customer.notes ?? null,
    currency: commerce.currency,
    subtotalCents: priced.subtotalCents,
    shippingCents: priced.shippingCents,
    codFeeCents: priced.codFeeCents,
    totalCents: priced.totalCents,
    items: {
      create: priced.lines.map((l) => ({
        productSlug: l.product.slug,
        purchaseCode: l.product.purchaseCode,
        title: l.product.title,
        image: l.product.image,
        unitPriceCents: l.product.priceCents,
        quantity: l.quantity,
      })),
    },
  };
}
