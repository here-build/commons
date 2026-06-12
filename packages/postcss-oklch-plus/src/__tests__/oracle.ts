/**
 * culori-backed gamut model — the trusted reference oracle, used ONLY in tests to validate the
 * zero-dep Ottosson port. culori is a devDependency; no shipped module imports it.
 */
import { clampChroma } from "culori";
import type { GamutModel } from "../gamut.js";

const CEIL = 0.5;

export function culoriGamut(rgbGamut: "p3" | "rgb"): GamutModel {
  function maxChroma(L: number, hue: number): number {
    const reduced = clampChroma({ mode: "oklch", l: L, c: CEIL, h: hue }, "oklch", rgbGamut);
    return reduced && typeof reduced.c === "number" ? reduced.c : 0;
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
