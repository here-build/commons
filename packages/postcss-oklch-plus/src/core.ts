/**
 * Core perceptual color math, ported verbatim from here.build's Delta design system
 * (`second-foundation/delta-css/src/foundation.css`). Pure, dependency-free, and shared
 * by every consumer (the PostCSS plugin here, plus the planned Houdini worklet + playground).
 *
 * Two recipes:
 *
 *  1. GAMUT CLAMP — `maxChromaBell` / `clampChromaBell`. Browsers currently *clip* out-of-gamut
 *     OKLCH per-channel (hue-shifting the result) instead of reducing chroma; this bell-curve
 *     bound keeps the color inside P3 the honest way. See the bug trackers in the README.
 *
 *  2. HELMHOLTZ–KOHLRAUSCH — `hkCompensation` over a `HueModel`. Saturated colors look brighter than
 *     their measured OKLCH L; this derives how much L to *subtract* so a colored element sits level
 *     with a neutral gray at the same L. The `nayatani` model fits the *shape* of Nayatani-1997's
 *     VAC hue term q(θ) (R²=0.98), at fixed chroma, re-expressed in OKLCH hue and rescaled to
 *     Delta's compensation budget — shape is Nayatani's, magnitude is Delta's (S_uv/K_Br dropped).
 *
 * THE LOAD-BEARING FACT: every transcendental (`cos`, `sin`) lives inside `nayataniHueFactor`,
 * which is a pure function of HUE alone. That is why a static hue lets the whole H-K term fold to
 * a constant at build time — even when L or C are animated. See `../lower.ts`.
 */

/** Major chroma cap before hue-shift-on-clip becomes visible in P3 (Delta's 0.35). */
export const DEFAULT_CHROMA_CAP = 0.35;

/** Coefficient on the H-K compensation: `lf * 0.14 * chroma * hueFactor`. */
export const HK_K = 0.14;

/* ------------------------------------------------------------------ gamut */

/**
 * The "bell" envelope: a POLE TAPER plus a stylistic chroma cap. `min(cap, sqrt(min(L,1-L)/2))`
 * fades chroma to zero at the white/black poles (preventing the hue distortion you get approaching
 * the lightness extremes) and caps at `cap`.
 *
 * IMPORTANT: this is NOT a per-hue gamut bound. It is hue-agnostic and over-permissive vs P3 on
 * almost all of the (hue, L) plane (it admits up to ~6× the legal chroma for low-gamut hues). Use
 * the P3/sRGB Ottosson tiers (`GamutModel`) for an actual in-gamut guarantee. Bell is the LAST
 * RESORT, reserved for the dynamic-hue case where the true per-hue boundary isn't computable in CSS.
 */
export function maxChromaBell(L: number, cap = DEFAULT_CHROMA_CAP): number {
  return Math.min(cap, Math.sqrt(Math.max(0, Math.min(L, 1 - L)) / 2)); // max(0,…) → no NaN out of range
}

/** Clamp a requested chroma to the bell envelope at `L` (chroma floored at 0). */
export function clampChromaBell(L: number, C: number, cap = DEFAULT_CHROMA_CAP): number {
  return Math.min(maxChromaBell(L, cap), Math.max(0, C));
}

/** The same clamp as a live CSS expression (used when `L` is dynamic and cannot be pre-resolved). */
export function clampChromaBellCss(LExpr: string, CExpr: string, cap = DEFAULT_CHROMA_CAP): string {
  return `min(${cap}, sqrt(max(0, min(${LExpr}, 1 - ${LExpr})) / 2), ${CExpr})`;
}

/* --------------------------------------------------------------------- H-K */

/**
 * A hue model maps OKLCH hue → the H-K brightness-excess weight, as a pure function of hue. That
 * purity is what lets a static hue bake to a constant (zero runtime trig).
 *
 *   nayatani — a 3-harmonic Fourier fit (R²=0.98) of the *shape* of Nayatani-1997's VAC hue term
 *              q(θ), at fixed chroma, re-expressed in OKLCH hue, rescaled to Delta's budget —
 *              perceptually correct in hue allocation (shape Nayatani's, magnitude Delta's).
 */
export interface HueModel {
  /** numeric, build-time */
  factor(hueDeg: number): number;
  /** live CSS expression, dynamic-hue fallback only */
  factorCss(hueExpr: string): string;
}

/* --- nayatani (default): scaled 3-harmonic fit of Nayatani-1997 VAC, in OKLCH hue ----------- */
/* Coefficients = discrete-Fourier fit of the VAC hue weight (0.0872 − 0.1340·q(θ(H))), where q is
   Nayatani's 4-harmonic predictor and θ is the CIELUV hue angle of OKLCH hue H. Scaled so the mean
   equals Delta's 0.779 — the compensation BUDGET is unchanged, only correctly reallocated across
   hue (yellow loses its bogus excess, magenta gains its due). Fit R²=0.981 vs real Nayatani. */
const NAY_A0 = 0.77911;
const NAY_COS = [0.08091, 0.06202, -0.01415] as const;
const NAY_SIN = [-0.13593, -0.00365, 0.03377] as const;

export function nayataniHueFactor(hueDeg: number): number {
  let v = NAY_A0;
  for (let k = 1; k <= 3; k++) {
    const r = (k * hueDeg * Math.PI) / 180;
    v += NAY_COS[k - 1]! * Math.cos(r) + NAY_SIN[k - 1]! * Math.sin(r);
  }
  return v;
}

export function nayataniHueFactorCss(hueExpr: string): string {
  const sign = (n: number) => (n < 0 ? "-" : "+");
  let s = `${NAY_A0}`;
  for (let k = 1; k <= 3; k++) {
    const ang = `${k} * (${hueExpr}) * 1deg`;
    s += ` ${sign(NAY_COS[k - 1]!)} ${Math.abs(NAY_COS[k - 1]!)} * cos(${ang})`;
    s += ` ${sign(NAY_SIN[k - 1]!)} ${Math.abs(NAY_SIN[k - 1]!)} * sin(${ang})`;
  }
  return `calc(${s})`;
}

export const NAYATANI: HueModel = { factor: nayataniHueFactor, factorCss: nayataniHueFactorCss };

/** H-K lightness compensation (amount to SUBTRACT from L). Defaults to the Nayatani model. */
export function hkCompensation(
  chroma: number,
  hueDeg: number,
  lightnessFactor = 1,
  model: HueModel = NAYATANI,
): number {
  return lightnessFactor * HK_K * chroma * model.factor(hueDeg);
}

/* -------------------------------------------------------------------- util */

export function clamp(lo: number, x: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
