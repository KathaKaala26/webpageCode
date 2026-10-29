"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import type { SizeOption } from "@/lib/pricing";
import InquireButton from "./InquireButton";

export default function SizeSelector({
  title,
  available,
  sizes,
}: {
  title: string;
  available: boolean;
  sizes: SizeOption[];
}) {
  const [selected, setSelected] = useState(0);
  const size = sizes[selected];

  return (
    <div>
      <p className="mt-5 text-3xl font-extrabold text-ink">{formatMoney(size.priceCents)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sizes.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={i === selected}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              i === selected ? "border-maroon bg-maroon text-shankh" : "border-ink/15 bg-white text-ink-soft hover:border-maroon hover:text-maroon"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <InquireButton title={`${title} — ${size.label}`} available={available} />
      </div>
    </div>
  );
}
