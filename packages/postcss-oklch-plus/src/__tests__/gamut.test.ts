import { describe, expect, it } from "vitest";
import postcss from "postcss";
import plugin, { type PluginOptions } from "../index.js";
import { ottossonGamut } from "../gamut-ottosson.js";

function value(css: string, opts?: PluginOptions): string {
  const out = postcss([plugin(opts)]).process(`a { color: ${css}; }`, { from: undefined }).css;
  return out.match(/color:\s*(.+);/)![1]!;
}

/** Replicate the plugin's expectation directly from the shipped Ottosson model. */
function expectedMaxChroma(L: number, hue: number, cap = 0.35): number {
  return Number(Math.min(cap, ottossonGamut("p3").maxChroma(L, hue)).toFixed(4));
}

describe("gamut: p3 — ① exact per-(L,H) max (L + H static)", () => {
  it("clamps a static color to the exact P3 chroma at that L and hue", () => {
    const exact = expectedMaxChroma(0.7, 30);
    expect(value("oklch-safe(0.7 0.5 30)", { gamut: "p3" })).toBe(`oklch(0.7 ${exact} 30)`);
  });

  it("is tighter (more correct) than the bell for a narrow-gamut hue", () => {
    // deep blue (~264°) has far less P3 chroma than the bell's flat 0.35 cap admits
    const exact = expectedMaxChroma(0.5, 264);
    expect(exact).toBeLessThan(0.35);
    expect(value("oklch-safe(0.5 0.5 264)", { gamut: "p3" })).toBe(`oklch(0.5 ${exact} 264)`);
  });

  it("leaves in-gamut chroma untouched", () => {
    expect(value("oklch-safe(0.7 0.02 30)", { gamut: "p3" })).toBe("oklch(0.7 0.02 30)");
  });
});

describe("gamut: p3 — ② per-hue cusp wrap (L dynamic, H static)", () => {
  it("emits the two cusp-anchored lines, trig-free", () => {
    const out = value("oklch-safe(var(--l) 0.5 30)", { gamut: "p3" });
    expect(out).not.toContain("cos(");
    expect(out).not.toContain("sqrt("); // not the bell — the cusp triangle
    expect(out).toMatch(/min\(0\.5, calc\([\d.]+ \* var\(--l\)\), calc\([\d.]+ \* \(1 - var\(--l\)\)\)\)/);
  });

  it("the cusp triangle peaks at the real cusp chroma", () => {
    const { L: Lc, C: Cc } = ottossonGamut("p3").cusp(30);
    const cap = Math.min(0.35, Cc);
    // at L = Lc, both lines evaluate to the cusp chroma
    expect((cap / Lc) * Lc).toBeCloseTo(cap, 6);
    expect((cap / (1 - Lc)) * (1 - Lc)).toBeCloseTo(cap, 6);
  });
});

describe("P3 is the default; bell is opt-in", () => {
  it("default clamps to the exact P3 boundary", () => {
    expect(value("oklch-safe(0.7 0.5 30)")).toBe(`oklch(0.7 ${expectedMaxChroma(0.7, 30)} 30)`);
  });
  it("gamut:'bell' uses the hue-agnostic envelope (the stylistic cap, not a gamut bound)", () => {
    expect(value("oklch-safe(0.7 0.5 30)", { gamut: "bell" })).toBe("oklch(0.7 0.35 30)");
  });
});
