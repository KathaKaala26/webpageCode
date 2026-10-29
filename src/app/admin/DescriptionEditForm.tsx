"use client";

import { useActionState } from "react";
import { updateProductDescription } from "./actions";

export default function DescriptionEditForm({ slug, description }: { slug: string; description: string }) {
  const [state, action, pending] = useActionState(updateProductDescription, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="description"
        defaultValue={description}
        rows={3}
        placeholder="Leave blank to hide the description for this product."
        className="field py-1.5 text-xs"
      />
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Saving…" : "Save description"}
      </button>
      {state?.error && <p role="alert" className="text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
