"use client";

import { useActionState } from "react";
import { updateExchangeRate } from "./actions";

export default function ExchangeRateForm({ usdToGbp }: { usdToGbp: number }) {
  const [state, action, pending] = useActionState(updateExchangeRate, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-soft">$1 USD =</span>
      <input
        type="number"
        name="rate"
        step="0.0001"
        min="0.0001"
        defaultValue={usdToGbp}
        required
        className="field h-9 w-24 py-1 text-xs"
      />
      <span className="text-xs text-ink-soft">GBP</span>
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Saving…" : "Save rate"}
      </button>
      {state?.error && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
