import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, siteUrl } from "@/lib/stripe";
import { CheckoutError, newOrderNumber, orderData, parseCustomer, priceItems } from "@/lib/orders";
import { commerce } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const method = body.paymentMethod === "COD" ? "COD" : "STRIPE";
    const customer = parseCustomer(body.customer);
    if (method === "COD" && !(commerce.codCountries as readonly string[]).includes(customer.country)) {
      throw new CheckoutError("Cash on delivery isn't available for that country.");
    }
    const priced = await priceItems(body.items, method);

    // ── Cash on delivery: record the order and we're done ─────────────
    if (method === "COD") {
      const order = await prisma.order.create({
        data: { ...orderData(customer, priced), orderNumber: newOrderNumber(), paymentMethod: "COD", status: "COD_PENDING" },
      });
      return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
    }

    // ── Stripe: create a pending order, then a Checkout Session ───────
    const order = await prisma.order.create({
      data: { ...orderData(customer, priced), orderNumber: newOrderNumber(), paymentMethod: "STRIPE", status: "PENDING_PAYMENT" },
    });

    const base = siteUrl(req);
    const line_items = priced.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: commerce.currency,
        unit_amount: l.product.priceCents,
        product_data: {
          name: `${l.product.title}`,
          description: `Purchase code ${l.product.purchaseCode}`,
          images: [base + l.product.image],
        },
      },
    }));

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: customer.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: priced.shippingCents === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: priced.shippingCents, currency: commerce.currency },
          },
        },
      ],
      success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout?cancelled=1`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[checkout]", err);
    return NextResponse.json({ error: "We couldn't place your order right now. Please try again." }, { status: 500 });
  }
}
