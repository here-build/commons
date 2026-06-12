import { describe, expect, it } from "vitest";
import { ottossonGamut, _LMS_TO_SRGB } from "../gamut-ottosson.js";
import { culoriGamut } from "./oracle.js";

/**
 * Differential test: the zero-dep Ottosson port must agree with the culori oracle. This is the gate
 * that proves the composed P3 / sRGB matrices are correct.
 */

/** Ottosson's published LMS→linear-sRGB matrix — our composition must reproduce it. */
const OTTOSSON_SRGB_REF = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];

describe("matrix self-check", () => {
  it("composed LMS→linear-sRGB equals Ottosson's published matrix", () => {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        expect(_LMS_TO_SRGB[i]![j]!).toBeCloseTo(OTTOSSON_SRGB_REF[i]![j]!, 3);
  });
});

describe.each([
  ["p3", "p3"],
  ["srgb", "rgb"],
] as const)("Ottosson ↔ culori parity (%s)", (ours, theirs) => {
  const mine = ottossonGamut(ours);
  const oracle = culoriGamut(theirs);

  it("maxChroma agrees across a hue × L grid incl. low-L (±0.003)", () => {
    let worst = 0;
    for (let hue = 0; hue < 360; hue += 10) {
      // start at L=0.02 — the low-L wide-gamut region is where the sRGB margin is thinnest
      for (let L = 0.02; L <= 0.98; L += 0.04) {
        const diff = Math.abs(mine.maxChroma(L, hue) - oracle.maxChroma(L, hue));
        worst = Math.max(worst, diff);
      }
    }
    expect(worst).toBeLessThan(0.003);
  });

  it("cusp agrees across hues (±0.003)", () => {
    for (let hue = 0; hue < 360; hue += 30) {
      const a = mine.cusp(hue);
      const b = oracle.cusp(hue);
      expect(Math.abs(a.L - b.L)).toBeLessThan(0.01);
      expect(Math.abs(a.C - b.C)).toBeLessThan(0.003);
    }
  });
});
