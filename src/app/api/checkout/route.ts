import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, siteUrl } from "@/lib/stripe";
import { CheckoutError, newOrderNumber, orderData, parseCustomer, priceItems } from "@/lib/orders";
import { commerce } from "@/lib/site";
import { getUsdToGbpRate } from "@/lib/currency";

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
    // UK orders are charged in GBP — converted here from the USD catalogue
    // price, right before building the order/session, so the DB order and
    // the actual Stripe charge always match exactly.
    const isGBP = customer.country === "GB";
    const chargeCurrency = isGBP ? "gbp" : commerce.currency;
    const rate = isGBP ? await getUsdToGbpRate() : 1;

    const chargedLines = priced.lines.map((l) => {
      const unitCents = isGBP ? Math.round(l.product.priceCents * rate) : l.product.priceCents;
      return { ...l, product: { ...l.product, priceCents: unitCents }, lineCents: unitCents * l.quantity };
    });
    const subtotalCents = chargedLines.reduce((s, l) => s + l.lineCents, 0);
    const shippingCents = isGBP ? Math.round(priced.shippingCents * rate) : priced.shippingCents;
    const chargedPriced = { lines: chargedLines, subtotalCents, shippingCents, codFeeCents: 0, totalCents: subtotalCents + shippingCents };

    const order = await prisma.order.create({
      data: { ...orderData(customer, chargedPriced), currency: chargeCurrency, orderNumber: newOrderNumber(), paymentMethod: "STRIPE", status: "PENDING_PAYMENT" },
    });

    const base = siteUrl(req);
    const line_items = chargedPriced.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: chargeCurrency,
        unit_amount: l.product.priceCents,
        product_data: {
          // Stripe rejects an empty product name — admins can blank a title
          // for display, but checkout still needs something non-empty.
          name: l.product.title || l.product.purchaseCode,
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
            display_name: chargedPriced.shippingCents === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: chargedPriced.shippingCents, currency: chargeCurrency },
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
