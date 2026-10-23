"use client";

import { useEffect, useState } from "react";

/** slug -> admin-set price override in cents, fetched from /api/prices. */
export function usePriceOverrides(): Record<string, number> {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    fetch("/api/prices")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => alive && setOverrides(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return overrides;
}
