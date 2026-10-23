// Store-wide settings. Edit these, not the components.

export const site = {
  name: "Katha & Kaala",
  shortName: "Katha & Kaala",
  tagline: "Online Store",
  description:
    "Authentic Indian artwork — Pattachitra, palm-leaf paintings and the leelas of Lord Krsna — sourced directly from artisans in India.",
  basedIn: "Minneapolis, Minnesota",
  // Shown in the footer "Location & Hours" block. Leave a field empty to hide it.
  location: {
    address: "Minneapolis, MN, USA",
    hours: "",
    phone: "(817) 666-5006",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  } as { address: string; hours: string; phone: string; email: string },
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
} as const;

export const commerce = {
  currency: "usd",
  currencyLabel: "USD",
  locale: "en-US",
  // Flat shipping per order, in cents. Orders at or above the free-shipping
  // threshold ship free. Set freeShippingThresholdCents to 0 to disable.
  shippingFlatCents: 1500,
  freeShippingThresholdCents: 20000,
  // Optional surcharge for cash on delivery orders (0 = none).
  codFeeCents: 0,
  // Countries we ship to. COD is offered for every country listed here;
  // remove a country from codCountries to switch COD off for it.
  shipCountries: [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
  ],
  codCountries: ["US", "CA"],
  maxQtyPerItem: 5,
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/more-about-us", label: "More About Us" },
  { href: "/pattachitra", label: "Pattachitra" },
  { href: "/books", label: "Books" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
] as const;
