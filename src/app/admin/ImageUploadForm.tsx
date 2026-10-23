"use client";

import { useActionState } from "react";
import { uploadProductImage } from "./actions";

export default function ImageUploadForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(uploadProductImage, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        required
        className="max-w-[220px] text-xs file:mr-2 file:rounded-full file:border-0 file:bg-shankh file:px-3 file:py-1.5 file:text-xs file:font-bold"
      />
      <button type="submit" disabled={pending} className="btn-outline h-9 px-3 text-xs">
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state?.error && <p role="alert" className="w-full text-xs font-semibold text-sindoor">{state.error}</p>}
    </form>
  );
}
