import Link from "next/link";
import type { PriceSort } from "@/lib/pricing";

/** Price "low to high" / "high to low" sort links, styled like the Shop page's category
 * chips. `basePath` + `extraParams` (e.g. the active category) are preserved in each link so
 * sorting never loses an existing filter. */
export default function PriceSortChips({
  basePath,
  sort,
  extraParams = {},
}: {
  basePath: string;
  sort?: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const hrefFor = (next?: PriceSort) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(extraParams)) if (v) params.set(k, v);
    if (next) params.set("sort", next);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const chip = (label: string, next: PriceSort | undefined, on: boolean) => (
    <Link
      key={label}
      href={hrefFor(next)}
      scroll={false}
      aria-current={on ? "true" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        on ? "border-maroon bg-maroon text-shankh" : "border-ink/15 bg-white text-ink-soft hover:border-maroon hover:text-maroon"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex shrink-0 gap-2">
      {chip("Price: Low to High", "price-asc", sort === "price-asc")}
      {chip("Price: High to Low", "price-desc", sort === "price-desc")}
    </div>
  );
}
