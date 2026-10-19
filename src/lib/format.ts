import { commerce } from "./site";

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(commerce.locale, {
    style: "currency",
    currency: commerce.currency.toUpperCase(),
  }).format(cents / 100);
}

export function shippingFor(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  const t = commerce.freeShippingThresholdCents;
  if (t > 0 && subtotalCents >= t) return 0;
  return commerce.shippingFlatCents;
}
