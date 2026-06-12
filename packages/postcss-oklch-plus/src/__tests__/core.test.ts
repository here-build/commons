import { describe, expect, it } from "vitest";
import {
  nayataniHueFactor,
  deltaHueFactor,
  hkCompensation,
  maxChromaBell,
  clampChromaBell,
  DELTA,
} from "../core.js";

describe("nayataniHueFactor (default, corrected)", () => {
  it("is a pure function of hue", () => {
    expect(nayataniHueFactor(30)).toBeCloseTo(0.8428, 3);
  });

  it("fixes the perceptual peaks: magenta bright, yellow dim", () => {
    // the whole point of the rework — the old delta curve had these inverted
    expect(nayataniHueFactor(300)).toBeGreaterThan(nayataniHueFactor(110)); // magenta > yellow
    expect(nayataniHueFactor(110)).toBeLessThan(nayataniHueFactor(30)); // yellow < red-orange
    expect(nayataniHueFactor(300)).toBeGreaterThan(nayataniHueFactor(150)); // magenta > green
  });
});

describe("deltaHueFactor (legacy parity)", () => {
  it("is preserved unchanged for byte-parity mode", () => {
    expect(deltaHueFactor(30)).toBeCloseTo(0.75, 2);
  });
});

describe("hkCompensation", () => {
  it("is zero at zero chroma (neutral elements get no H-K shift)", () => {
    expect(hkCompensation(0, 30)).toBe(0);
  });

  it("defaults to the corrected Nayatani model", () => {
    // 1 * 0.14 * 0.2 * 0.8428 = 0.0236
    expect(hkCompensation(0.2, 30)).toBeCloseTo(0.0236, 4);
  });

  it("reproduces the legacy value under the delta model", () => {
    // 1 * 0.14 * 0.2 * 0.75 = 0.021
    expect(hkCompensation(0.2, 30, 1, DELTA)).toBeCloseTo(0.021, 4);
  });

  it("scales linearly with chroma", () => {
    expect(hkCompensation(0.4, 30)).toBeCloseTo(2 * hkCompensation(0.2, 30), 6);
  });
});

describe("gamut clamp", () => {
  it("falls to zero chroma at the lightness poles", () => {
    expect(maxChromaBell(0)).toBe(0);
    expect(maxChromaBell(1)).toBe(0);
  });

  it("caps at the chroma cap in the mid-range", () => {
    expect(maxChromaBell(0.5)).toBe(0.35);
  });

  it("never returns more chroma than requested", () => {
    expect(clampChromaBell(0.5, 0.2)).toBe(0.2);
    expect(clampChromaBell(0.5, 0.9)).toBe(0.35);
  });
});
