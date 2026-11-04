"use client";

export default function ProductSearchFilter() {
  return (
    <input
      type="search"
      placeholder="Search by title or category…"
      className="field mt-4 h-10 w-full max-w-sm"
      onChange={(e) => {
        const q = e.target.value.trim().toLowerCase();
        document.querySelectorAll<HTMLElement>("[data-product-card]").forEach((el) => {
          const hay = el.dataset.search ?? "";
          el.style.display = !q || hay.includes(q) ? "" : "none";
        });
      }}
    />
  );
}
