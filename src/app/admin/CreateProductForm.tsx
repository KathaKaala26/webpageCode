"use client";

import { useActionState } from "react";
import { createProduct } from "./actions";

export default function CreateProductForm({ categories }: { categories: string[] }) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input name="title" placeholder="Title" required className="field h-9 py-1.5 text-xs" />
      <input name="category" list="existing-categories" placeholder="Category" required className="field h-9 py-1.5 text-xs" />
      <datalist id="existing-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <input name="price" type="number" min="0.01" step="0.01" placeholder="Price (USD)" required className="field h-9 py-1.5 text-xs" />
      <select name="section" defaultValue="SHOP" className="field h-9 py-1.5 text-xs">
        <option value="SHOP">Shop</option>
        <option value="PUJA_ESSENTIALS">Puja Essentials</option>
        <option value="BOOKS">Books</option>
      </select>
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="field h-9 py-1 text-xs" />
      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" disabled={pending} className="btn-primary h-10 px-6 text-sm">
          {pending ? "Creating…" : "Create product"}
        </button>
        {state?.error && <p role="alert" className="mt-2 text-xs font-semibold text-sindoor">{state.error}</p>}
      </div>
    </form>
  );
}
