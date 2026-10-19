# Katha & Kaala — Online Store

A responsive, installable (PWA) rebuild of
[harekrishna2025.wixsite.com/katha-and-kala](https://harekrishna2025.wixsite.com/katha-and-kala)
with a shopping cart, **Stripe card payments** and **cash on delivery**, plus a
chat assistant that replaces Wix Chat.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Prisma 6 ·
Supabase Postgres · Stripe Checkout · Vercel

---

## What carried over from the Wix site

| Wix page | New route | Notes |
|---|---|---|
| HOME | `/` | All sections and copy: Welcome, Your Place for Indian Art, Our Art Gallery, Palm Leaf Pattachitra, Colorful Pattachitra, News, Additional Products |
| MORE ABOUT US | `/more-about-us` | About Us, Our Mission, Our Specialty: Pattachitra — full text, all 3 images |
| PATTACHITRA | `/pattachitra` | All 6 sections (Palm Leave Painting, Leelas, Abstract and Colorful, Small Art, Uniquely Pattachitra, Vintage) — each now has a price and **Add to cart** |
| BOOKS | `/books` | "Coming SOON" text unchanged |
| — | `/shop`, `/shop/[slug]` | New: catalogue with category filters and a page per artwork |
| — | `/cart`, `/checkout`, `/order/success` | New: cart and checkout |
| — | `/admin` | New: orders + chat messages (password protected) |

- **Images** are the original files, loaded straight from the Wix media CDN
  (`static.wixstatic.com`), so nothing was re-shot or re-cropped. If you ever
  close the Wix site, download them into `public/art/` and update the URLs in
  `src/lib/products.ts`.
- **Purchase codes** GB101, KN 14, GB 101, HD 105 and RHC 150 are exactly as on
  the Wix site. Artworks that had no code got placeholder codes `KK-201 … KK-210`.
- ⚠️ The Wix site uses **GB101** and **GB 101** for two different artworks.
  Both are kept; give one a unique code in `src/lib/products.ts`.
- ⚠️ The Wix menu's **"More…"** items are rendered by script and couldn't be read
  from outside. If there are extra pages, add them to `nav` in `src/lib/site.ts`.

## ⚠️ Before going live

1. **Set real prices** — every `priceCents` in `src/lib/products.ts` is a
   placeholder (`12900` = $129.00). Set `available: false` when a piece sells.
2. **Shipping / COD fee / countries** — `commerce` in `src/lib/site.ts`
   (defaults: $15 flat, free over $200, no COD fee, USA + Canada).
3. **Footer contact details** — `site.location` in `src/lib/site.ts`.

---

## Setup

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npx prisma db push              # creates the Order / OrderItem / Enquiry tables
npm run dev                     # http://localhost:3000
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → *Transaction pooler* (port 6543), add `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Same page → *Session pooler / direct* (port 5432) — used by `prisma db push` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | See "Stripe webhook" below |
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://kathaandkaala.com` |
| `ADMIN_PASSWORD` | Any password, for `/admin` |
| `ADMIN_SESSION_SECRET` | Any long random string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Optional — shows a "WhatsApp us" button in chat (digits only, e.g. `16125550123`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional — shown in the footer |

### Stripe webhook

Stripe Dashboard → Developers → Webhooks → **Add endpoint**
- URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
and use card `4242 4242 4242 4242`.

(The success page also confirms payment directly with Stripe, so orders are
marked paid even if the webhook is delayed.)

### Deploy to Vercel

1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.example` under Project → Settings → Environment Variables.
3. Deploy. `npm run build` runs `prisma generate` automatically.
4. Add the Stripe webhook pointing at the production URL.

---

## How it works

### Cart
- Stored in `localStorage` (`kk_cart_v1`) so it survives reloads, works offline
  and syncs between tabs and the installed app.
- Slide-out cart drawer from the header bag icon, plus a full `/cart` page.

### Checkout & payments
- One form for both methods (`/checkout`). The browser sends only product
  slugs + quantities; **prices are always recalculated on the server** from
  `products.ts`, so they can't be tampered with.
- **Card (Stripe):** order saved as `PENDING_PAYMENT` → Stripe Checkout →
  webhook / success page marks it `PAID`. Supports Apple Pay & Google Pay
  automatically (enable them in Stripe → Settings → Payment methods).
- **Cash on delivery:** order saved as `COD_PENDING` instantly; customer sees a
  confirmation with the amount to keep ready.

### Admin (`/admin`)
- Orders tab: filter by status, see customer, address, items, total; change
  status (Processing → Shipped → Delivered / Cancelled).
- Chat messages tab: messages left through the chat assistant, with
  reply-by-email links and "mark as handled".

### Chat assistant (replaces Wix Chat)
Wix Chat only runs on Wix-hosted sites, so it's replaced with a built-in
assistant (`src/components/ChatWidget.tsx`, answers in `src/lib/chatbot.ts`):
- Look up any **purchase code** ("GB101", "kn 14") and add it to the cart from chat.
- Answers about payment, cash on delivery, shipping, Pattachitra, palm-leaf
  art, Krsna leelas, books, authenticity and prices.
- **"Talk to a person"** → message form saved to the admin inbox, plus an
  optional WhatsApp button.
- Runs in the browser, so it keeps working in the installed app offline.
- To change answers, edit `src/lib/chatbot.ts`.

### PWA
- `public/manifest.webmanifest` + icons → "Install app" on Android/Chrome/Edge
  (button in the footer) and Add to Home Screen on iOS.
- `public/sw.js` service worker:
  - pages: network-first, falling back to the last saved copy, then `/offline.html`
  - artwork images and fonts: cached for fast repeat visits and offline browsing
  - never caches checkout, orders, admin or API calls
- Shows an "offline" bar and a "new version available — Refresh" prompt.
- The service worker only registers in production (`npm run build && npm start`).
  After changing `sw.js`, bump `VERSION` at its top.

## Project map

```
src/lib/products.ts      ← catalogue: prices, codes, images, sold-out flags
src/lib/site.ts          ← store settings: menu, shipping, COD, countries, contact
src/lib/chatbot.ts       ← chat assistant answers
src/lib/orders.ts        ← server-side validation & pricing
src/app/api/checkout     ← creates orders (COD) / Stripe sessions
src/app/api/webhooks/stripe
src/app/api/enquiry      ← chat "leave a message"
src/app/admin            ← orders + messages dashboard
prisma/schema.prisma     ← Order, OrderItem, Enquiry
public/sw.js, public/manifest.webmanifest, public/offline.html
```
