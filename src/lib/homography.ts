export type Point = { x: number; y: number };

/**
 * Solves the 8-parameter planar homography mapping the axis-aligned rectangle
 * (0,0)-(w,0)-(w,h)-(0,h) — corners in TL, TR, BR, BL order — onto 4 arbitrary
 * destination points, given in the same TL, TR, BR, BL order.
 *
 * Returns [h0..h7] for the matrix [[h0,h1,h2],[h3,h4,h5],[h6,h7,1]] (row-major,
 * homogeneous coords), via direct linear transform + Gaussian elimination.
 */
export function computeHomography(srcRect: { w: number; h: number }, dst: [Point, Point, Point, Point]): number[] {
  const src: Point[] = [
    { x: 0, y: 0 },
    { x: srcRect.w, y: 0 },
    { x: srcRect.w, y: srcRect.h },
    { x: 0, y: srcRect.h },
  ];

  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }

  return solveLinearSystem(A, b);
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > maxAbs) {
        maxAbs = Math.abs(M[r][col]);
        pivotRow = r;
      }
    }
    if (pivotRow !== col) [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-10) {
      throw new Error("computeHomography: degenerate point configuration");
    }
    for (let c = col; c <= n; c++) M[col][c] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  return M.map((row) => row[n]);
}

/** Forward-maps a point through the homography. Used for self-checks only. */
export function mapPoint(h: number[], p: Point): Point {
  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;
  const w = h6 * p.x + h7 * p.y + 1;
  return {
    x: (h0 * p.x + h1 * p.y + h2) / w,
    y: (h3 * p.x + h4 * p.y + h5) / w,
  };
}

/**
 * Embeds the homography into a CSS matrix3d() string. The source plane stays
 * at z=0 (column 3 is the untouched identity (0,0,1,0)); the browser's own
 * perspective divide by the resulting w (column 4's h6/h7 terms) does the
 * projective warp, so no extra CSS `perspective` property is needed.
 */
export function toCssMatrix3d(h: number[]): string {
  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;
  const values = [h0, h3, 0, h6, h1, h4, 0, h7, 0, 0, 1, 0, h2, h5, 0, 1];
  return `matrix3d(${values.join(",")})`;
}
