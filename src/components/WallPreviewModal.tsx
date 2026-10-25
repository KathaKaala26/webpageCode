"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon } from "./Icons";
import ArtOverlay from "./ArtOverlay";
import { detectWallQuad, defaultQuad, type Quad } from "@/lib/wallDetector";

type Step = "upload" | "detecting" | "editing";

type Props = {
  artSrc: string;
  artAlt: string;
  onClose: () => void;
};

export default function WallPreviewModal({ artSrc, artAlt, onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [artAspect, setArtAspect] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Escape-to-close + body scroll lock, matching CartDrawer's convention.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Learn the art's own aspect ratio up front, for a nicely-proportioned default quad.
  useEffect(() => {
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (alive && img.naturalWidth && img.naturalHeight) setArtAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = artSrc;
    return () => {
      alive = false;
    };
  }, [artSrc]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!containerRef.current || naturalSize === null) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalSize]);

  const displayScale = naturalSize && containerWidth ? containerWidth / naturalSize.w : null;

  const screenQuad = useMemo<Quad | null>(() => {
    if (!quad || !displayScale) return null;
    return quad.map((p) => ({ x: p.x * displayScale, y: p.y * displayScale })) as Quad;
  }, [quad, displayScale]);

  function handleFile(file: File) {
    setError(null);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setNaturalSize(null);
    setQuad(null);
    setStep("upload");
  }

  async function onPhotoLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) {
      setError("Couldn't read that photo — please try another.");
      return;
    }
    setNaturalSize({ w, h });
    setStep("detecting");
    const detected = await detectWallQuad(img);
    setQuad(detected ?? defaultQuad(w, h, artAspect));
    setStep("editing");
  }

  function onPhotoError() {
    setError("Couldn't read that photo — please try another.");
    setPhotoUrl(null);
    setNaturalSize(null);
    setStep("upload");
  }

  function resetPosition() {
    if (!naturalSize) return;
    setQuad(defaultQuad(naturalSize.w, naturalSize.h, artAspect));
  }

  function onHandlePointerDown(index: number, e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragIndexRef.current = index;
  }

  function onHandlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const index = dragIndexRef.current;
    if (index === null || !containerRef.current || !quad || !displayScale) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;
    const next = [...quad] as Quad;
    next[index] = { x, y };
    setQuad(next);
  }

  function onHandlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    dragIndexRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/60" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preview on your wall"
        className="fixed inset-x-0 bottom-0 top-8 z-50 flex flex-col overflow-hidden rounded-t-3xl bg-shankh shadow-2xl sm:inset-8 sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between bg-maroon px-5 text-shankh">
          <h2 className="font-display text-2xl text-shankh">Preview on your wall</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          {error && <p className="mb-4 rounded-lg bg-sindoor/10 px-3 py-2 text-sm font-semibold text-sindoor">{error}</p>}

          {!photoUrl && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-ink/15 bg-white p-12 text-center">
              <p className="font-display text-xl text-maroon">Upload a photo of your wall</p>
              <p className="max-w-sm text-sm text-ink-soft">
                We&apos;ll try to spot the wall automatically — you can always drag the corners to line it up yourself.
              </p>
              <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                Choose a photo
              </button>
            </div>
          )}

          {photoUrl && naturalSize === null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="hidden" onLoad={onPhotoLoad} onError={onPhotoError} />
          )}

          {photoUrl && naturalSize && (
            <div className="flex flex-col gap-4">
              <div
                ref={containerRef}
                className="relative w-full touch-none overflow-hidden rounded-2xl bg-shankh-dark"
                style={{ aspectRatio: `${naturalSize.w} / ${naturalSize.h}`, maxHeight: "70vh" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Your wall" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

                {screenQuad && <ArtOverlay artSrc={artSrc} artAlt={artAlt} quad={screenQuad} />}

                {step === "detecting" && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/50 text-sm font-semibold text-white">Finding your wall…</div>
                )}

                {step === "editing" &&
                  screenQuad &&
                  screenQuad.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Adjust corner ${i + 1}`}
                      className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-white bg-sindoor shadow-card"
                      style={{ left: p.x, top: p.y }}
                      onPointerDown={(e) => onHandlePointerDown(i, e)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={onHandlePointerUp}
                    />
                  ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-secondary" onClick={resetPosition} disabled={step !== "editing"}>
                  Reset position
                </button>
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  Upload a different photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
