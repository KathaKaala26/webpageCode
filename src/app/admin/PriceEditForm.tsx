"use client";

import { useActionState } from "react";
import { updateProductPrice } from "./actions";

export default function PriceEditForm({ slug, priceCents }: { slug: string; priceCents: number }) {
  const [state, action, pending] = useActionState(updateProductPrice, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <span className="text-xs text-ink-soft">$</span>
      <input
        type="number"
        name="price"
        step="0.01"
        min="0.01"
        defaultValue={(priceCents / 100).toFixed(2)}
        required
        className="field h-9 w-24 py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Saving…" : "Save price"}
      </button>
      {state?.error && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
