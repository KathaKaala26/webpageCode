# Katha & Kaala — Online Store

A responsive, installable (PWA) rebuild of
[harekrishna2025.wixsite.com/katha-and-kala](https://harekrishna2025.wixsite.com/katha-and-kala)
with a shopping cart, **Stripe card payments** (USD, and GBP for UK orders)
and **cash on delivery**, an admin dashboard for orders/pricing/images, and a
chat assistant that replaces Wix Chat.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 3 · Prisma 6 ·
Supabase Postgres + Storage · Stripe Checkout · Vercel · Vercel Analytics

**Live:** https://katha-and-kala.vercel.app
**Repo:** https://github.com/SuniketSolutions/KalaaandKathaa

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
| — | `/contact` | New: phone/email + a message form (lands in the admin inbox) |
| — | `/admin` | New: orders, chat messages, product images/pricing (password protected) |

- **Images** default to the original Wix media CDN files (`static.wixstatic.com`)
  so nothing was re-shot or re-cropped, but any image can now be replaced from
  `/admin` → **Products** (uploaded to Supabase Storage) without touching code
  — see [Product images & pricing](#product-images--pricing-admin) below.
- **Purchase codes** GB101, KN 14, GB 101, HD 105 and RHC 150 are exactly as on
  the Wix site. Artworks that had no code got placeholder codes `KK-201 … KK-210`.
- ⚠️ The Wix site uses **GB101** and **GB 101** for two different artworks.
  Both are kept; give one a unique code in `src/lib/products.ts`.
- ⚠️ The Wix menu's **"More…"** items are rendered by script and couldn't be read
  from outside. If there are extra pages, add them to `nav` in `src/lib/site.ts`.

## ⚠️ Before going fully live

1. **Set real prices** — every `priceCents` in `src/lib/products.ts` is a
   placeholder (`12900` = $129.00), or override them live from `/admin` →
   Products without a redeploy. Set `available: false` when a piece sells.
2. **Switch Stripe to live mode** — the site currently runs on a Stripe
   **test** key. Until then, `/contact` and a banner on `/cart` point
   customers to phone/email for real orders. Swap `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` for live-mode values and remove the
   `<PaymentNotice />` line in `src/app/cart/page.tsx` once ready.
3. **Check the GBP exchange rate** — `/admin` → Products → "UK checkout
   exchange rate" is seeded with a placeholder; set it to the real current rate.
4. **Shipping / COD fee / countries** — `commerce` in `src/lib/site.ts`
   (defaults: $15 flat, free over $500, no COD fee; ships to USA, Canada, UK —
   COD only in USA + Canada).
5. **Footer contact details** — `site.location` in `src/lib/site.ts`.
6. **Custom domain** — currently on `katha-and-kala.vercel.app`; a real domain
   matters for trust and SEO.

---

## Setup

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npx prisma db push              # creates all tables (Order, Product*, Enquiry, ExchangeRate)
npm run dev                     # http://localhost:3000
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (port 6543), add `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Same page → **Session pooler** (port 5432) — used by `prisma db push` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | See "Stripe webhook" below |
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://kathaandkaala.com` |
| `ADMIN_PASSWORD` | Any password, for `/admin` |
| `ADMIN_SESSION_SECRET` | Any long random string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Optional — shows a "WhatsApp us" button in chat (digits only, e.g. `16125550123`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown in the footer and on `/contact` |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL — used for admin image uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` secret. **Full-access, server-only — never expose to the browser or commit it.** |
| `GMAIL_USER` | Optional — Gmail address used to email you new Contact form / chat enquiries. |
| `GMAIL_APP_PASSWORD` | Optional — **must be a Gmail App Password**, not your account password. myaccount.google.com → Security → 2-Step Verification → App passwords → generate one for "Mail". |
| `CONTACT_NOTIFY_EMAIL` | Optional — where enquiry emails are sent. Defaults to `GMAIL_USER` if unset. |

Supabase Storage also needs a public bucket named **`product-images`** (created
once via the Supabase dashboard, or the `@supabase/supabase-js` admin client —
see `src/lib/supabaseAdmin.ts`).

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

1. Push to GitHub, import the repo in Vercel (`vercel link`), or deploy
   directly with the Vercel CLI (`vercel --prod`).
2. Add every variable from `.env.example` under Project → Settings →
   Environment Variables.
3. Deploy. `vercel build` / `npm run build` run `prisma generate && next build`
   automatically.
4. Add the Stripe webhook pointing at the production URL.

### Auto-deploy on push (GitHub Actions)

`.github/workflows/deploy.yml` deploys to Vercel production on every push to
`main`, using the Vercel CLI rather than Vercel's GitHub App integration (the
app couldn't be authorized for this GitHub org). ✅ Configured and active — it
needs three **GitHub repository secrets** (repo → Settings → Secrets and
variables → Actions):

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Generate at Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `team_E5pZ4616fGUPJGc9IZqAA63x` |
| `VERCEL_PROJECT_ID` | `prj_bQSAyrwDPt2GYfhCAAweNrqgcFoO` |

The workflow triggers a **remote** build on Vercel's own infrastructure
(`vercel deploy --prod`), the same as a manual `vercel --prod` — it does not
pull env vars or build locally in the runner, since `vercel pull`/`vercel env
pull` has been returning empty placeholder values for this project rather
than the real decrypted env vars (a CLI/account quirk, not a secrets
misconfiguration — Vercel's own remote builds inject the real values fine).
Without the 3 secrets set, the Action will fail; `vercel --prod` from a
local/CLI session still works as a manual fallback.

### Analytics & SEO

- **Vercel Web Analytics** is wired in (`@vercel/analytics`) but must be
  switched on once per project: Vercel dashboard → the project → **Analytics**
  tab → Enable.
- **Google Search Console**: add the site as a property at
  [search.google.com/search-console](https://search.google.com/search-console),
  verify, and submit `/sitemap.xml`.
- Structured data (Organization + Product/Offer JSON-LD) is already emitted
  site-wide (`src/app/layout.tsx`) and per product (`src/app/shop/[slug]/page.tsx`).

---

## How it works

### Cart
- Stored in `localStorage` (`kk_cart_v1`) so it survives reloads, works offline
  and syncs between tabs and the installed app.
- Slide-out cart drawer from the header bag icon, plus a full `/cart` page.
- A banner on `/cart` points customers to phone/email while Stripe is in test
  mode (`src/components/PaymentNotice.tsx` — remove once card payments go live).

### Checkout & payments
- One form for both methods (`/checkout`). The browser sends only product
  slugs + quantities; **prices are always recalculated on the server** from
  `products.ts` plus any admin override, so they can't be tampered with.
- **Card (Stripe):** order saved as `PENDING_PAYMENT` → Stripe Checkout →
  webhook / success page marks it `PAID`. Supports Apple Pay & Google Pay
  automatically (enable them in Stripe → Settings → Payment methods).
  **UK orders are charged in GBP**, converted from the USD catalogue price at
  checkout time using the admin-set exchange rate (`src/lib/currency.ts`);
  every other country is charged in USD.
- **Cash on delivery:** USA + Canada only (not UK). Order saved as
  `COD_PENDING` instantly; customer sees a confirmation with the amount to
  keep ready.

### Product images & pricing (`/admin` → Products)
- **Images**: upload a replacement photo per product — stored in Supabase
  Storage, served through `/img/[slug]` (which falls back to the original Wix
  image if no override exists). Changes appear on the live site within
  seconds, no redeploy. "Revert to original image" removes the override.
- **Prices**: edit a product's price directly; it updates the storefront
  display **and** what Stripe actually charges (the checkout API reads the
  same override). "Revert to original price" removes it.
- **UK exchange rate**: a single admin-editable USD→GBP rate used only when
  converting a GB order's total at checkout.

### Admin (`/admin`)
- **Orders** tab: filter by status, see customer, address, items, total; change
  status (Processing → Shipped → Delivered / Cancelled).
- **Chat messages** tab: messages left through the chat assistant or the
  `/contact` form, with reply-by-email links and "mark as handled".
- **Products** tab: image uploads, price overrides, UK exchange rate (above).

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
src/lib/products.ts      ← catalogue: prices, codes, default images, sold-out flags
src/lib/pricing.ts        ← merges admin price overrides into the catalogue
src/lib/currency.ts       ← USD → GBP conversion rate for UK checkout
src/lib/site.ts           ← store settings: menu, shipping, COD, countries, contact
src/lib/chatbot.ts        ← chat assistant answers
src/lib/orders.ts         ← server-side validation & pricing (always USD/catalogue)
src/lib/supabaseAdmin.ts  ← server-only Supabase Storage client (image uploads)
src/app/api/checkout      ← creates orders (COD) / Stripe sessions (incl. GBP conversion)
src/app/api/webhooks/stripe
src/app/api/enquiry       ← chat "leave a message" + /contact form
src/app/api/prices        ← public price-override lookup (cart/chat live pricing)
src/app/img/[slug]        ← serves admin-uploaded image or falls back to the original
src/app/admin             ← orders, messages, product images/pricing dashboard
src/app/contact           ← phone/email + message form
prisma/schema.prisma      ← Order, OrderItem, Enquiry, ProductImage, ProductPrice, ExchangeRate
.github/workflows/deploy.yml ← auto-deploy to Vercel on push to main
public/sw.js, public/manifest.webmanifest, public/offline.html
```
