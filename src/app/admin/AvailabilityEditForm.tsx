"use client";

import { useState, useTransition } from "react";
import { updateProductAvailability } from "./actions";

export default function AvailabilityEditForm({ slug, available }: { slug: string; available: boolean }) {
  const [value, setValue] = useState(available ? "true" : "false");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = fd.get("available");
    startTransition(async () => {
      await updateProductAvailability(fd);
      // The write is already confirmed by the time updateProductAvailability resolves —
      // Cloudflare's tag cache can take a moment to propagate to the next server-rendered
      // payload, so trust the just-submitted value here rather than whatever the
      // (possibly still-stale) post-action re-render sends back.
      if (typeof submitted === "string") setValue(submitted);
    });
  }

  return (
    <div>
      <p className="text-xs font-bold text-ink-soft">Availability{value === "false" ? " (sold out)" : ""}</p>
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="slug" value={slug} />
        <select
          name="available"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="field h-9 w-auto py-1 text-xs"
        >
          <option value="true">In stock</option>
          <option value="false">Sold out</option>
        </select>
        <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
