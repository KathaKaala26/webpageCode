import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { markPaid } from "@/lib/payments";
import { formatMoney } from "@/lib/format";
import ClearCart from "@/components/ClearCart";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

type SP = Promise<{ order?: string; session_id?: string }>;

async function findOrder(sp: { order?: string; session_id?: string }) {
  if (sp.session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sp.session_id);
      // Don't wait for the webhook — confirm the payment right here too.
      await markPaid(session);
      const id = session.metadata?.orderId;
      return id ? prisma.order.findUnique({ where: { id }, include: { items: true } }) : null;
    } catch (e) {
      console.error("[order success] stripe lookup failed", e);
      return null;
    }
  }
  if (sp.order) return prisma.order.findUnique({ where: { id: sp.order }, include: { items: true } });
  return null;
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: SP }) {
  const order = await findOrder(await searchParams);

  if (!order) {
    return (
      <section className="container-kk py-24 text-center">
        <h1 className="text-4xl font-semibold">We couldn&apos;t find that order</h1>
        <p className="mt-4 text-ink-soft">If you&apos;ve just paid, your confirmation email is on its way. Questions? Use the chat button below.</p>
        <Link href="/shop" className="btn-primary mt-8">Back to the shop</Link>
      </section>
    );
  }

  const isCOD = order.paymentMethod === "COD";
  const paid = order.status === "PAID";

  return (
    <section className="container-kk max-w-3xl py-14 sm:py-20">
      <ClearCart />
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf text-3xl text-white" aria-hidden>✓</div>
        <p className="eyebrow mt-6">Order {order.orderNumber}</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          {isCOD
            ? `Your order is placed. Please keep ${formatMoney(order.totalCents, order.currency)} in cash ready for when your artwork is delivered.`
            : paid
              ? "Your payment was received and your order is confirmed."
              : "We're confirming your payment with Stripe — this usually takes a few seconds. Refresh this page if the status hasn't updated."}
        </p>
      </div>

      <div className="card mt-10 p-5 sm:p-6">
        <ul className="divide-y divide-ink/10">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-shankh-dark">
                <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{it.title}</p>
                <p className="text-xs text-ink-soft">{it.purchaseCode} · Qty {it.quantity}</p>
              </div>
              <span className="font-bold">{formatMoney(it.unitPriceCents * it.quantity, order.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(order.subtotalCents, order.currency)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingCents ? formatMoney(order.shippingCents, order.currency) : "Free"}</dd></div>
          {order.codFeeCents > 0 && <div className="flex justify-between"><dt>COD handling</dt><dd>{formatMoney(order.codFeeCents, order.currency)}</dd></div>}
          <div className="flex justify-between text-lg"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatMoney(order.totalCents, order.currency)}</dd></div>
          <div className="flex justify-between text-ink-soft"><dt>Payment</dt><dd>{isCOD ? "Cash on delivery" : paid ? "Paid by card" : "Card — confirming"}</dd></div>
        </dl>
        <div className="mt-5 rounded-xl bg-shankh p-4 text-sm">
          <p className="font-bold text-maroon">Delivering to</p>
          <p className="mt-1 text-ink-soft">
            {order.customerName}, {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.city}, {order.region} {order.postalCode}, {order.country}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn-outline">Continue shopping</Link>
      </div>
    </section>
  );
}
