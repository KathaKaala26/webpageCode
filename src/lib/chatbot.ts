// Katha & Kaala shop assistant — replaces the Wix Chat widget.
// Runs entirely in the browser (so it also works offline in the installed
// app). Anything it can't answer is handed to a person via the "Leave a
// message" form (saved to the admin inbox) or WhatsApp.

import { categories, findByCode, products, type Product } from "./products";
import { commerce } from "./site";
import { formatMoney } from "./format";

export type BotAction =
  | { type: "link"; label: string; href: string }
  | { type: "contact" }
  | { type: "whatsapp" };

export type BotReply = {
  text: string;
  products?: Product[];
  actions?: BotAction[];
  quick?: string[];
};

export const QUICK_START = ["Show me palm leaf art", "How do I pay?", "Shipping to Canada?", "What is Pattachitra?", "Talk to a person"];

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

const CODE_RE = /\b(kk[\s-]?\d{3}|[a-z]{2,3}[\s-]?\d{2,3})\b/i;

export function reply(input: string): BotReply {
  const t = ` ${input.toLowerCase().trim()} `;

  // Purchase codes ("GB101", "kn 14", "HD-105")
  const code = input.match(CODE_RE)?.[1];
  if (code) {
    const found = findByCode(code);
    if (found.length)
      return {
        text: found.length > 1 ? `I found ${found.length} artworks with code ${found[0].purchaseCode}:` : `Here's ${found[0].purchaseCode}:`,
        products: found,
      };
  }

  if (has(t, " hi ", "hello", " hey", "namaste", "hare krishna", "good morning", "good evening"))
    return {
      text: "Namaste! 🙏 I'm the Katha & Kaala assistant. I can help you find an artwork, look up a purchase code, or answer questions about payment and delivery.",
      quick: QUICK_START,
    };

  if (has(t, "human", "person", "talk to", "speak", "contact", "call you", "email you", "someone"))
    return {
      text: "Happy to connect you with our team. Leave a message and we'll reply by email — usually within a day.",
      actions: [{ type: "contact" }, { type: "whatsapp" }],
    };

  if (has(t, "cash", "cod", "on delivery"))
    return {
      text: `Yes — cash on delivery is available in ${commerce.codCountries.length > 1 ? "the USA and Canada" : "your country"}. Choose "Cash on delivery" at checkout and pay when your artwork arrives.${
        commerce.codFeeCents ? ` A ${formatMoney(commerce.codFeeCents)} handling fee applies.` : ""
      }`,
      actions: [{ type: "link", label: "Go to checkout", href: "/checkout" }],
    };

  if (has(t, "pay", "card", "stripe", "visa", "mastercard", "apple pay", "google pay", "payment"))
    return {
      text: "You can pay two ways: by card through Stripe (Visa, Mastercard, Amex, Apple Pay, Google Pay), or cash on delivery. Card payments are handled on Stripe's secure page — we never see your card details.",
      quick: ["Is cash on delivery available?", "Shipping cost?"],
    };

  if (has(t, "ship", "deliver", "canada", "usa", " us ", "america", "how long", "arrive", "postage"))
    return {
      text: `We ship across ${commerce.shipCountries.map((c) => c.name).join(" and ")}. Shipping is ${formatMoney(commerce.shippingFlatCents)} per order${
        commerce.freeShippingThresholdCents ? `, and free on orders over ${formatMoney(commerce.freeShippingThresholdCents)}` : ""
      }. Every piece is sourced directly from India, so we'll email you as soon as yours is on its way.`,
      quick: ["How do I pay?", "Talk to a person"],
    };

  if (has(t, "track", "my order", "order status", "where is", "refund", "return", "cancel", "damaged", "broken"))
    return {
      text: "For anything about an existing order, please send us a message with your order number (it starts with KK-) and we'll get right back to you.",
      actions: [{ type: "contact" }, { type: "whatsapp" }],
    };

  if (has(t, "palm"))
    return {
      text: "Palm-leaf Pattachitra takes weeks to make — the leaves are dried, painted and stitched by hand, so every piece is one of a kind.",
      products: products.filter((p) => p.category === "Palm Leaf Pattachitra"),
    };

  if (has(t, "krishna", "krsna", "leela", "lila", "yasoda", "gopi"))
    return {
      text: "Much of our artwork highlights the leelas of Lord Krsna — from Maa Yasoda to the Gopis.",
      products: products.filter((p) => ["Krsna Leelas", "Stories of Life"].includes(p.category)),
    };

  if (has(t, "jagannath", "odisha", "what is pattachitra", "about pattachitra", "meaning", "history", "chitrakar"))
    return {
      text: "Pattachitra is a traditional art form from Odisha — “patta” means cloth and “chitra” means picture. Painted by Chitrakars with natural pigments, it shows deities like Lord Jagannath, Balabhadra and Subhadra, and stories from the Ramayana and Mahabharata.",
      actions: [{ type: "link", label: "Read more about us", href: "/more-about-us" }, { type: "link", label: "See Pattachitra", href: "/pattachitra" }],
    };

  if (has(t, "book"))
    return {
      text: "Books are coming soon! We'll be sourcing children's story books directly from India.",
      actions: [{ type: "link", label: "Books page", href: "/books" }],
    };

  if (has(t, "authentic", "real", "genuine", "original", "handmade", "artisan"))
    return {
      text: "Every piece is authentic and sourced directly from trusted artisans in India — you're supporting the craftspeople who keep these traditions alive.",
    };

  if (has(t, "who are you", "about you", "minneapolis", "where are you", "your story"))
    return {
      text: "We're based in the suburbs of Minneapolis, sharing Indian art and culture with the world — especially communities in the USA, Canada and the United Kingdom.",
      actions: [{ type: "link", label: "More about us", href: "/more-about-us" }],
    };

  // Category names ("vintage", "small art", "colorful"…)
  const cat = categories.find(
    (c) =>
      t.includes(c.toLowerCase()) ||
      c
        .toLowerCase()
        .split(" ")
        .some((w) => w.length > 4 && w !== "pattachitra" && t.includes(` ${w}`)),
  );
  if (cat) return { text: `Here's our ${cat} collection:`, products: products.filter((p) => p.category === cat) };

  if (has(t, "price", "cost", "how much", "cheap", "budget", "expensive")) {
    const sorted = [...products].filter((p) => p.available).sort((a, b) => a.priceCents - b.priceCents);
    return {
      text: `Our artworks range from ${formatMoney(sorted[0].priceCents)} to ${formatMoney(sorted[sorted.length - 1].priceCents)}. Here are a few to start with:`,
      products: sorted.slice(0, 3),
      actions: [{ type: "link", label: "Browse all", href: "/shop" }],
    };
  }

  if (has(t, "show", "buy", "shop", "art", "painting", "recommend", "gift", "browse"))
    return {
      text: "Here are some favourites:",
      products: products.filter((p) => p.featured),
      actions: [{ type: "link", label: "Open the shop", href: "/shop" }],
    };

  if (has(t, "thank"))
    return { text: "You're very welcome! Hare Krishna 🙏" };

  return {
    text: "I'm not sure I understood that. You can type a purchase code (like GB101), ask about payment or delivery, or leave a message for our team.",
    quick: QUICK_START,
    actions: [{ type: "contact" }],
  };
}
