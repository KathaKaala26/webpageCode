import type { Point } from "./homography";

export type Quad = [Point, Point, Point, Point];

const MAX_DETECT_DIM = 1000;
const DETECT_TIMEOUT_MS = 6000;

let cvPromise: Promise<unknown> | null = null;

/** Lazily loads the OpenCV.js WASM module exactly once per page session. */
async function loadCv(): Promise<unknown> {
  if (!cvPromise) {
    cvPromise = (async () => {
      const cvModule = (await import("@techstark/opencv-js")) as unknown as Record<string, unknown>;
      const mod = (cvModule.default ?? cvModule) as Record<string, unknown> & { onRuntimeInitialized?: () => void };
      let cv: unknown;
      if (mod instanceof Promise) {
        cv = await mod;
      } else if (mod.Mat) {
        cv = mod;
      } else {
        await new Promise<void>((resolve) => {
          mod.onRuntimeInitialized = resolve;
        });
        cv = mod;
      }
      (window as unknown as { cv: unknown }).cv = cv;
      return cv;
    })();
  }
  return cvPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("detection timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Best-effort auto-detection of a wall/flat-surface quadrilateral in an
 * uploaded photo. Returns points in the photo's own natural pixel space
 * (img.naturalWidth/naturalHeight), or `null` on any failure, low-confidence
 * result, or timeout — callers must always have a manual-quad fallback ready.
 */
export async function detectWallQuad(img: HTMLImageElement): Promise<Quad | null> {
  try {
    return await withTimeout(detectWallQuadInner(img), DETECT_TIMEOUT_MS);
  } catch {
    return null;
  }
}

async function detectWallQuadInner(img: HTMLImageElement): Promise<Quad | null> {
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  if (!naturalW || !naturalH) return null;

  const scale = Math.min(1, MAX_DETECT_DIM / Math.max(naturalW, naturalH));
  const detectW = Math.max(1, Math.round(naturalW * scale));
  const detectH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = detectW;
  canvas.height = detectH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, detectW, detectH);

  const cv = (await loadCv()) as {
    imread: (c: HTMLCanvasElement) => { delete: () => void };
  };
  const scannerMod = (await import("jscanify/client")) as unknown as Record<string, unknown>;
  const JScanify = (scannerMod.default ?? scannerMod) as new () => {
    findPaperContour: (m: unknown) => { delete: () => void } | null;
    getCornerPoints: (c: unknown) => {
      topLeftCorner?: Point;
      topRightCorner?: Point;
      bottomRightCorner?: Point;
      bottomLeftCorner?: Point;
    };
  };
  const scanner = new JScanify();

  const mat = cv.imread(canvas);
  try {
    const contour = scanner.findPaperContour(mat);
    if (!contour) return null;
    try {
      const corners = scanner.getCornerPoints(contour);
      const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = corners;
      if (!topLeftCorner || !topRightCorner || !bottomRightCorner || !bottomLeftCorner) return null;

      const toNatural = (p: Point): Point => ({ x: p.x / scale, y: p.y / scale });
      return [toNatural(topLeftCorner), toNatural(topRightCorner), toNatural(bottomRightCorner), toNatural(bottomLeftCorner)];
    } finally {
      contour.delete();
    }
  } finally {
    mat.delete();
  }
}

/**
 * A centered quad (in natural pixel space) matching the art's own aspect
 * ratio — the starting point whenever detection fails, times out, or the
 * user clicks "Reset position".
 */
export function defaultQuad(naturalW: number, naturalH: number, artAspect: number): Quad {
  const maxW = naturalW * 0.6;
  const maxH = naturalH * 0.6;
  let w = maxW;
  let h = w / artAspect;
  if (h > maxH) {
    h = maxH;
    w = h * artAspect;
  }
  const cx = naturalW / 2;
  const cy = naturalH / 2;
  return [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
}
