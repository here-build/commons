/**
 * Zero-dependency gamut model — our own implementation of the oklab→linear-RGB gamut intersection
 * (after Björn Ottosson's "Colorpicker / gamut clipping" work, MIT).
 *
 * Ottosson's published fast path bakes constants fitted to sRGB primaries. We instead keep it
 * gamut-parametric: the only thing that differs between sRGB and Display-P3 is the final
 * LMS→linear-RGB matrix, which we compose from standard XYZ matrices. Max chroma is then found by
 * a short bisection on the gamut boundary (this runs at build time, so the analytic shortcut buys
 * nothing — correctness and zero deps win). Validated for parity against culori (see parity test).
 */
import type { GamutModel } from "./gamut.js";

type Row = readonly [number, number, number];
type M3 = readonly [Row, Row, Row];
type V3 = [number, number, number];

function apply(M: M3, v: V3): V3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

function mul(A: M3, B: M3): M3 {
  const out: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      out[i]![j] = A[i]![0]! * B[0]![j]! + A[i]![1]! * B[1]![j]! + A[i]![2]! * B[2]![j]!;
  return out as unknown as M3;
}

/** oklab L,a,b → nonlinear LMS' (the linear part of Ottosson's M2⁻¹). */
const LAB_TO_LMS: M3 = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
];

/** linear LMS → XYZ (D65) — inverse of Ottosson's XYZ→LMS (M1). */
const LMS_TO_XYZ: M3 = [
  [1.2268798733741557, -0.5578149965554813, 0.28139105017721583],
  [-0.04057576262431372, 1.1122868293970594, -0.07171106666151701],
  [-0.07637294974672142, -0.4214933239627914, 1.5869240244272187],
];

/** XYZ (D65) → linear sRGB. */
const XYZ_TO_SRGB: M3 = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];

/** XYZ (D65) → linear Display-P3. */
const XYZ_TO_P3: M3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
];

const LMS_TO_SRGB = mul(XYZ_TO_SRGB, LMS_TO_XYZ);
const LMS_TO_P3 = mul(XYZ_TO_P3, LMS_TO_XYZ);

const DEG = Math.PI / 180;
const CEIL = 0.5;
const TOL = 1e-7;

function oklchToLinear(L: number, C: number, hueDeg: number, toRgb: M3): V3 {
  const a = C * Math.cos(hueDeg * DEG);
  const b = C * Math.sin(hueDeg * DEG);
  const lms_ = apply(LAB_TO_LMS, [L, a, b]);
  const lms: V3 = [lms_[0] ** 3, lms_[1] ** 3, lms_[2] ** 3];
  return apply(toRgb, lms);
}

function inGamut(rgb: V3): boolean {
  return rgb.every((c) => c >= -TOL && c <= 1 + TOL);
}

function makeModel(toRgb: M3): GamutModel {
  function maxChroma(L: number, hue: number): number {
    if (!inGamut(oklchToLinear(L, 0, hue, toRgb))) return 0; // L out of range → no chroma fits
    let lo = 0;
    let hi = CEIL;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, hue, toRgb))) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  function cusp(hue: number): { L: number; C: number } {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 50; i++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (maxChroma(m1, hue) < maxChroma(m2, hue)) lo = m1;
      else hi = m2;
    }
    const L = (lo + hi) / 2;
    return { L, C: maxChroma(L, hue) };
  }

  return { maxChroma, cusp };
}

const P3 = makeModel(LMS_TO_P3);
const SRGB = makeModel(LMS_TO_SRGB);

export function ottossonGamut(gamut: "p3" | "srgb"): GamutModel {
  return gamut === "p3" ? P3 : SRGB;
}

/** Exposed for the self-check test: our composed sRGB matrix should equal Ottosson's published one. */
export const _LMS_TO_SRGB = LMS_TO_SRGB;
