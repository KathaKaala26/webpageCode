"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProductSize } from "./actions";

export default function SizeAddForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(addProductSize, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="text" name="label" placeholder="e.g. Large" required className="field h-9 w-24 py-1 text-xs" />
      <span className="text-xs text-ink-soft">$</span>
      <input type="number" name="price" step="0.01" min="0.01" placeholder="300.00" required className="field h-9 w-24 py-1 text-xs" />
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Adding…" : "Add size"}
      </button>
      {state?.error && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
