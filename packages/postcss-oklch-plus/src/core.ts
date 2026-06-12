/**
 * Core perceptual color math, ported verbatim from here.build's Delta design system
 * (`foundations/delta/delta-css/src/foundation.css`). Pure, dependency-free, and shared
 * by every consumer (the PostCSS plugin here, plus the planned Houdini worklet + playground).
 *
 * Two recipes:
 *
 *  1. GAMUT CLAMP — `maxChromaBell` / `clampChromaBell`. Browsers currently *clip* out-of-gamut
 *     OKLCH per-channel (hue-shifting the result) instead of reducing chroma; this bell-curve
 *     bound keeps the color inside P3 the honest way. See the bug trackers in the README.
 *
 *  2. HELMHOLTZ–KOHLRAUSCH — `deltaHueFactor` / `hkCompensation`. Saturated colors look brighter
 *     than their measured OKLCH L. This derives how much L to *subtract* so a colored element sits
 *     perceptually level with a neutral gray at the same L. It is a *simplified Nayatani* model:
 *     it keeps Nayatani's two-peak structure (a warm-hue lobe + an independent blue bump) but
 *     reduces it to an O(1) cosine + Gaussian so it lowers to cheap CSS instead of melting the
 *     style engine. Not naive, not the full VAC/VCC integral — deliberately simplified.
 *
 * THE LOAD-BEARING FACT: every transcendental (`cos`, `exp`) lives inside `deltaHueFactor`, which
 * is a pure function of HUE alone. That is why a static hue lets the whole H-K term fold to a
 * constant at build time — even when L or C are animated. See `../lower.ts`.
 */

const TAU = Math.PI * 2;

/** Major chroma cap before hue-shift-on-clip becomes visible in P3 (Delta's 0.35). */
export const DEFAULT_CHROMA_CAP = 0.35;

/** Coefficient on the H-K compensation: `lf * 0.14 * chroma * hueFactor`. */
export const HK_K = 0.14;

/* ------------------------------------------------------------------ gamut */

/**
 * Delta's bell-curve approximation of the maximum in-gamut chroma at lightness `L`.
 * `min(cap, sqrt(min(L, 1 - L) / 2))` — peaks in the mid-lightness range, falls to zero at the
 * black/white poles where no chroma fits.
 */
export function maxChromaBell(L: number, cap = DEFAULT_CHROMA_CAP): number {
  return Math.min(cap, Math.sqrt(Math.min(L, 1 - L) / 2));
}

/** Clamp a requested chroma to the in-gamut bell bound at `L`. */
export function clampChromaBell(L: number, C: number, cap = DEFAULT_CHROMA_CAP): number {
  return Math.min(maxChromaBell(L, cap), C);
}

/** The same clamp as a live CSS expression (used when `L` is dynamic and cannot be pre-resolved). */
export function clampChromaBellCss(LExpr: string, CExpr: string, cap = DEFAULT_CHROMA_CAP): string {
  return `min(${cap}, sqrt(min(${LExpr}, 1 - ${LExpr}) / 2), ${CExpr})`;
}

/* --------------------------------------------------------------------- H-K */

/**
 * Delta's two-peak H-K hue factor: warm-hue cosine lobe + independent Gaussian blue bump,
 * clamped to a sane range. Pure function of `hueDeg` (degrees) — the reason static hue is free.
 */
export function deltaHueFactor(hueDeg: number): number {
  const hueNorm = hueDeg / 360;
  const redYellow = Math.cos((hueNorm * 3 - 1) * TAU) * 0.45 + 0.75;
  const blueDistance = Math.abs(hueDeg - 255);
  const blueBump = 0.25 * Math.exp(-((blueDistance / 35) ** 2));
  return clamp(0.3, redYellow + blueBump, 1.2);
}

/** The hue factor as a live CSS expression — the dynamic-hue fallback that *does* pay runtime trig. */
export function deltaHueFactorCss(hueExpr: string): string {
  const hueNorm = `(${hueExpr} / 360)`;
  const redYellow = `(cos((${hueNorm} * 3 - 1) * ${TAU}) * 0.45 + 0.75)`;
  const blueDistance = `max(${hueExpr} - 255, 255 - ${hueExpr})`;
  const blueBump = `(0.25 * pow(2.71828, -1 * pow((${blueDistance}) / 35, 2)))`;
  return `clamp(0.3, ${redYellow} + ${blueBump}, 1.2)`;
}

/** H-K lightness compensation (amount to SUBTRACT from L). `lightnessFactor` is Delta's sign/scale. */
export function hkCompensation(
  chroma: number,
  hueDeg: number,
  lightnessFactor = 1,
): number {
  return lightnessFactor * HK_K * chroma * deltaHueFactor(hueDeg);
}

/* -------------------------------------------------------------------- util */

export function clamp(lo: number, x: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
