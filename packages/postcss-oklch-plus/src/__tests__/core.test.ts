import { describe, expect, it } from "vitest";
import {
  deltaHueFactor,
  hkCompensation,
  maxChromaBell,
  clampChromaBell,
} from "../core.js";

describe("deltaHueFactor", () => {
  it("is a pure function of hue with no chroma dependence", () => {
    // warm hue near the cosine lobe baseline
    expect(deltaHueFactor(30)).toBeCloseTo(0.75, 2);
  });

  it("peaks the blue bump near 255°", () => {
    expect(deltaHueFactor(255)).toBeGreaterThan(deltaHueFactor(255 + 90));
  });

  it("stays within the clamped range [0.3, 1.2]", () => {
    for (let h = 0; h < 360; h += 5) {
      const f = deltaHueFactor(h);
      expect(f).toBeGreaterThanOrEqual(0.3);
      expect(f).toBeLessThanOrEqual(1.2);
    }
  });
});

describe("hkCompensation", () => {
  it("is zero at zero chroma (neutral elements get no H-K shift)", () => {
    expect(hkCompensation(0, 30)).toBe(0);
  });

  it("matches the hand-computed Delta value for (0.2, 30°)", () => {
    // 1 * 0.14 * 0.2 * 0.75 = 0.021
    expect(hkCompensation(0.2, 30)).toBeCloseTo(0.021, 4);
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
