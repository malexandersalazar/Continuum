/**
 * Eye Aspect Ratio (EAR) — Soukupová & Čech (2016).
 *
 * EAR = (A + B) / (2 * C), where:
 *   A = dist(p1, p5)  — outer vertical pair
 *   B = dist(p2, p4)  — inner vertical pair
 *   C = dist(p0, p3)  — horizontal (corner-to-corner)
 *
 * Landmark ordering in this codebase follows MediaPipe FaceLandmarker 478-point mesh:
 *   index 0 = outer corner, index 3 = inner corner, indices 1&5 / 2&4 = vertical pairs.
 *
 * Typical open-eye EAR: 0.25–0.35. Closure threshold: ~0.22.
 * Use pixel-space coordinates (or normalized scaled by aspect ratio) for accuracy.
 */

export type EyePoint = [number, number]; // [x, y]

/** MediaPipe 478-point mesh indices for the left and right eye outlines. */
export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const;
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;

function euclidean(a: EyePoint, b: EyePoint): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute EAR for one eye given its 6 landmark points (pixel or scaled-normalized coordinates).
 * Returns NaN if C ≈ 0 (degenerate geometry — caller should discard).
 */
export function calculateEAR(eyePoints: EyePoint[]): number {
  const A = euclidean(eyePoints[1], eyePoints[5]);
  const B = euclidean(eyePoints[2], eyePoints[4]);
  const C = euclidean(eyePoints[0], eyePoints[3]);
  if (C < 1e-6) return NaN;
  return (A + B) / (2.0 * C);
}
