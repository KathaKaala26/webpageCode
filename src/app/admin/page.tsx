import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { products } from "@/lib/products";
import { DEFAULT_USD_TO_GBP } from "@/lib/currency";
import LoginForm from "./LoginForm";
import ImageUploadForm from "./ImageUploadForm";
import PriceEditForm from "./PriceEditForm";
import ExchangeRateForm from "./ExchangeRateForm";
import { logout, removeProductImage, removeProductPrice, toggleEnquiry, updateOrderStatus } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  COD_PENDING: "COD – new",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-ink/10 text-ink-soft",
  PAID: "bg-leaf/15 text-leaf",
  COD_PENDING: "bg-haldi/25 text-maroon",
  PROCESSING: "bg-haldi/25 text-maroon",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-leaf/15 text-leaf",
  CANCELLED: "bg-sindoor/10 text-sindoor-dark",
};

type SP = Promise<{ tab?: string; status?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  if (!(await isAdmin())) {
    return (
      <section className="container-kk py-16">
        <h1 className="text-center text-4xl font-semibold">Store admin</h1>
        <LoginForm />
      </section>
    );
  }

  const { tab = "orders", status } = await searchParams;
  const validStatus = status && STATUS_LABEL[status] ? status : undefined;

  const [orders, enquiries, counts, images, prices, exchangeRate] = await Promise.all([
    tab === "orders"
      ? prisma.order.findMany({
          where: validStatus ? { status: validStatus as never } : { NOT: { status: "PENDING_PAYMENT" } },
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
    tab === "messages" ? prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) : Promise.resolve([]),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    tab === "products" ? prisma.productImage.findMany() : Promise.resolve([]),
    tab === "products" ? prisma.productPrice.findMany() : Promise.resolve([]),
    tab === "products" ? prisma.exchangeRate.findUnique({ where: { id: 1 } }) : Promise.resolve(null),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const imageOverrideOf = (slug: string) => images.find((i) => i.slug === slug);
  const priceOverrideOf = (slug: string) => prices.find((i) => i.slug === slug);

  return (
    <section className="container-kk py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold">Store admin</h1>
        <form action={logout}>
          <button className="btn-outline h-10 px-4">Sign out</button>
        </form>
      </div>

      <nav className="mt-6 flex gap-2 border-b border-ink/10">
        {[
          ["orders", "Orders"],
          ["messages", "Chat messages"],
          ["products", "Products"],
        ].map(([k, label]) => (
          <Link key={k} href={`/admin?tab=${k}`} className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${tab === k ? "border-sindoor text-sindoor" : "border-transparent text-ink-soft"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "orders" && (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link href="/admin?tab=orders" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${!validStatus ? "bg-maroon text-white" : "bg-white"}`}>
              All placed
            </Link>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <Link key={k} href={`/admin?tab=orders&status=${k}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${validStatus === k ? "bg-maroon text-white" : "bg-white"}`}>
                {v} ({countOf(k)})
              </Link>
            ))}
          </div>

          {orders.length === 0 ? (
            <p className="card mt-6 p-8 text-center text-ink-soft">No orders here yet.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold text-maroon">{o.orderNumber}</p>
                      <p className="text-xs text-ink-soft">{o.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })} CT</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                      <span className="rounded-full bg-shankh px-3 py-1 text-xs font-bold">{o.paymentMethod === "COD" ? "Cash on delivery" : "Stripe"}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="font-bold">{o.customerName}</p>
                      <p><a className="text-sindoor" href={`mailto:${o.email}`}>{o.email}</a></p>
                      <p><a className="text-sindoor" href={`tel:${o.phone}`}>{o.phone}</a></p>
                    </div>
                    <div className="text-ink-soft">
                      {o.addressLine1}
                      {o.addressLine2 && <>, {o.addressLine2}</>}
                      <br />
                      {o.city}, {o.region} {o.postalCode}, {o.country}
                      {o.notes && <p className="mt-2 italic">“{o.notes}”</p>}
                    </div>
                    <div>
                      <ul className="space-y-1">
                        {o.items.map((it) => (
                          <li key={it.id}>
                            {it.quantity} × {it.title} <span className="text-ink-soft">({it.purchaseCode})</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-extrabold">Total {formatMoney(o.totalCents, o.currency)}</p>
                    </div>
                  </div>
                  <form action={updateOrderStatus} className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
                    <input type="hidden" name="id" value={o.id} />
                    <label htmlFor={`st-${o.id}`} className="text-sm font-semibold">Status</label>
                    <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="field w-auto py-2">
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button className="btn-primary h-10 px-4">Update</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "messages" && (
        <ul className="mt-6 space-y-4">
          {enquiries.length === 0 && <p className="card p-8 text-center text-ink-soft">No chat messages yet.</p>}
          {enquiries.map((e) => (
            <li key={e.id} className={`card p-5 ${e.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{e.name}</p>
                  <a className="text-sm text-sindoor" href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your message to Katha & Kaala")}`}>{e.email}</a>
                </div>
                <p className="text-xs text-ink-soft">{e.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })} CT{e.page ? ` · ${e.page}` : ""}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{e.message}</p>
              <form action={toggleEnquiry} className="mt-3">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="handled" value={String(!e.handled)} />
                <button className="text-sm font-bold text-maroon hover:underline">{e.handled ? "Mark as new" : "Mark as handled"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {tab === "products" && (
        <>
          <div className="card mt-6 p-4">
            <p className="text-sm font-bold text-maroon">UK checkout exchange rate</p>
            <p className="mt-1 text-xs text-ink-soft">Used to convert USD catalogue prices to GBP for United Kingdom orders at checkout.</p>
            <div className="mt-2">
              <ExchangeRateForm usdToGbp={exchangeRate?.usdToGbp ?? DEFAULT_USD_TO_GBP} />
            </div>
          </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const imageOverride = imageOverrideOf(p.slug);
            const priceOverride = priceOverrideOf(p.slug);
            const src = imageOverride ? `/img/${p.slug}?v=${imageOverride.updatedAt.getTime()}` : `/img/${p.slug}`;
            const currentPriceCents = priceOverride?.priceCents ?? p.priceCents;
            return (
              <li key={p.slug} className="card space-y-3 p-4">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-shankh-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={p.title} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="text-xs text-ink-soft">{p.purchaseCode} · {imageOverride ? "Custom image" : "Original image"}</p>
                </div>
                <ImageUploadForm slug={p.slug} />
                {imageOverride && (
                  <form action={removeProductImage}>
                    <input type="hidden" name="slug" value={p.slug} />
                    <button className="text-xs font-bold text-sindoor hover:underline">Revert to original image</button>
                  </form>
                )}

                <div className="border-t border-ink/10 pt-3">
                  <p className="text-xs font-bold text-ink-soft">
                    Price · {formatMoney(currentPriceCents)}{priceOverride ? " (custom)" : ""}
                  </p>
                  <div className="mt-2">
                    <PriceEditForm slug={p.slug} priceCents={currentPriceCents} />
                  </div>
                  {priceOverride && (
                    <form action={removeProductPrice} className="mt-2">
                      <input type="hidden" name="slug" value={p.slug} />
                      <button className="text-xs font-bold text-sindoor hover:underline">Revert to original price</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </section>
  );
}
