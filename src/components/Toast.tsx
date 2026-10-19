"use client";

import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toast } = useCart();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      {toast && (
        <div className="animate-slide-up rounded-full bg-ink px-5 py-3 text-sm font-semibold text-shankh shadow-lg">{toast}</div>
      )}
    </div>
  );
}
