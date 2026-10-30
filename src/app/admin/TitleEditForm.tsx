"use client";

import { useActionState } from "react";
import { updateProductTitle } from "./actions";

export default function TitleEditForm({ slug, title }: { slug: string; title: string }) {
  const [state, action, pending] = useActionState(updateProductTitle, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <input
        name="title"
        defaultValue={title}
        placeholder="Leave blank to hide the title for this product."
        className="field h-9 py-1.5 text-xs"
      />
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Saving…" : "Save title"}
      </button>
      {state?.error && <p role="alert" className="text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
