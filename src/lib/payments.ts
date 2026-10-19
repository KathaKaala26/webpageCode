import type Stripe from "stripe";
import { prisma } from "./prisma";

/** Mark the order behind a paid Checkout Session as PAID. Safe to call more
 *  than once (webhook retries + success-page check both use it). */
export async function markPaid(s: Stripe.Checkout.Session): Promise<void> {
  const orderId = s.metadata?.orderId;
  if (!orderId || s.payment_status !== "paid") return;
  await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["PENDING_PAYMENT", "CANCELLED"] } },
    data: { status: "PAID", paidAt: new Date(), stripeSessionId: s.id },
  });
}
