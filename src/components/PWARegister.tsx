"use client";

import { useEffect, useState } from "react";

/** Registers the service worker and offers a refresh when a new version ships. */
export default function PWARegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const sw = reg.installing;
            sw?.addEventListener("statechange", () => {
              if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
            });
          });
        })
        .catch((e) => console.warn("SW registration failed", e));

      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <>
      {offline && (
        <div role="status" className="fixed inset-x-0 top-0 z-[70] bg-ink py-1.5 text-center text-xs font-bold text-shankh" style={{ paddingTop: "calc(.375rem + env(safe-area-inset-top))" }}>
          You&apos;re offline — browsing saved pages. Checkout needs a connection.
        </div>
      )}
      {waiting && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-sm text-shankh shadow-xl">
          <span>A new version of the store is available.</span>
          <button type="button" onClick={() => waiting.postMessage("SKIP_WAITING")} className="btn-gold h-9 px-4 text-xs">
            Refresh
          </button>
        </div>
      )}
    </>
  );
}
