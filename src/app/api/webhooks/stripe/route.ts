import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { markPaid } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe → POST /api/webhooks/stripe
 *  Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *          checkout.session.expired */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text(); // must be the raw body for signature checks
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] bad signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      await markPaid(s);
    } else if (event.type === "checkout.session.expired") {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.orderId;
      if (orderId) {
        await prisma.order.updateMany({ where: { id: orderId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ received: true });
}
