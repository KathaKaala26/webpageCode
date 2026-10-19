"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

/** Empties the cart once the order is confirmed (used after the Stripe redirect). */
export default function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
