"use client";

import { useMemo, useState } from "react";
import { computeHomography, toCssMatrix3d } from "@/lib/homography";
import type { Quad } from "@/lib/wallDetector";

const REF_WIDTH = 500;

type Props = {
  artSrc: string;
  artAlt: string;
  /** The 4 corners (TL, TR, BR, BL), in on-screen CSS px relative to the containing box. */
  quad: Quad;
};

/**
 * Renders the art image warped onto `quad` via a CSS matrix3d homography.
 * The containing element must be `position: relative` (or similar) so this
 * absolutely-positioned image's untransformed origin (0,0) lines up with the
 * container's top-left corner.
 */
export default function ArtOverlay({ artSrc, artAlt, quad }: Props) {
  const [aspect, setAspect] = useState<number | null>(null);

  const refSize = useMemo(() => (aspect ? { w: REF_WIDTH, h: REF_WIDTH / aspect } : null), [aspect]);

  const transform = useMemo(() => {
    if (!refSize) return undefined;
    const h = computeHomography(refSize, quad);
    return toCssMatrix3d(h);
  }, [refSize, quad]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={artSrc}
      alt={artAlt}
      draggable={false}
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalWidth && el.naturalHeight) setAspect(el.naturalWidth / el.naturalHeight);
      }}
      className="pointer-events-none absolute left-0 top-0 select-none"
      style={
        refSize && transform
          ? { width: refSize.w, height: refSize.h, transformOrigin: "0 0", transform }
          : { width: 1, height: 1, opacity: 0 }
      }
    />
  );
}
