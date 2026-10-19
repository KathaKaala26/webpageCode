"use client";

import { useEffect, useState } from "react";
import { DownloadIcon } from "./Icons";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** "Install app" button: native prompt on Android/Chrome/Edge, instructions on iOS Safari. */
export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferred && !ios)) return null;

  return (
    <div>
      <button
        type="button"
        className="btn-gold"
        onClick={async () => {
          if (deferred) {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          } else setShowIosHelp((s) => !s);
        }}
      >
        <DownloadIcon /> Install the Katha &amp; Kaala app
      </button>
      {showIosHelp && (
        <p className="mt-3 max-w-xs rounded-xl bg-white/10 p-3 text-sm text-shankh/90">
          On iPhone/iPad: tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong>.
        </p>
      )}
    </div>
  );
}
