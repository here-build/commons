import { describe, expect, it } from "vitest";
import postcss from "postcss";
import plugin, { type PluginOptions } from "../index.js";

function run(css: string, opts?: PluginOptions): string {
  return postcss([plugin(opts)]).process(css, { from: undefined }).css;
}

function value(css: string, opts?: PluginOptions): string {
  // extract the right-hand side of the single `color:` declaration
  return run(`a { color: ${css}; }`, opts).match(/color:\s*(.+);/)![1]!;
}

describe("oklch-safe (gamut clamp only)", () => {
  it("bakes a static color to a flat clamped literal", () => {
    expect(value("oklch-safe(0.7 0.5 30)")).toBe("oklch(0.7 0.35 30)");
  });

  it("passes through chroma already in gamut", () => {
    expect(value("oklch-safe(0.7 0.1 30)")).toBe("oklch(0.7 0.1 30)");
  });

  it("keeps the clamp live when L is dynamic", () => {
    const out = value("oklch-safe(var(--l) 0.2 30)");
    expect(out).toContain("sqrt(");
    expect(out).toContain("var(--l)");
  });

  it("preserves alpha", () => {
    expect(value("oklch-safe(0.7 0.5 30 / 0.5)")).toBe("oklch(0.7 0.35 30 / 0.5)");
  });
});

describe("oklch-hk (H-K only, no clamp)", () => {
  it("subtracts H-K from L and leaves chroma untouched", () => {
    // nayatani hk(0.5, 30) = 0.14 * 0.5 * 0.8428 = 0.059 → L 0.641; chroma 0.5 NOT clamped
    expect(value("oklch-hk(0.7 0.5 30)")).toBe("oklch(0.641 0.5 30)");
  });

  it("static hue + dynamic L is trig-free", () => {
    const out = value("oklch-hk(var(--l) 0.2 30)");
    expect(out).not.toContain("cos(");
    expect(out).toBe("oklch(calc(var(--l) - 0.0236) 0.2 30)");
  });
});

describe("oklch-safe-hk (H-K + clamp)", () => {
  it("bakes a fully static color: H-K subtracted, chroma clamped", () => {
    // hk(0.2, 30) = 0.0236 → L 0.6764; chroma 0.2 in gamut
    expect(value("oklch-safe-hk(0.7 0.2 30)")).toBe("oklch(0.6764 0.2 30)");
  });

  it("HEADLINE: static hue + dynamic L emits ZERO runtime trig", () => {
    const out = value("oklch-safe-hk(var(--l) 0.2 30)");
    expect(out).not.toContain("cos(");
    expect(out).not.toContain("sin(");
    expect(out).toContain("calc(var(--l) - 0.0236)");
  });

  it("static hue + dynamic chroma stays trig-free (linear coefficient)", () => {
    const out = value("oklch-safe-hk(0.7 var(--c) 30)");
    expect(out).not.toContain("cos(");
    // coefficient = 0.14 * 0.8428 = 0.118
    expect(out).toContain("0.118 * var(--c)");
  });

  it("dynamic hue is the only case that pays live trig", () => {
    const out = value("oklch-safe-hk(0.7 0.2 var(--h))");
    expect(out).toContain("cos(");
    expect(out).toContain("sin(");
    expect(out).toContain("var(--h)");
  });

  it("delta model reproduces the legacy (miscalibrated) output for parity", () => {
    // legacy hk(0.2, 30) = 0.14 * 0.2 * 0.75 = 0.021 → L 0.679
    expect(value("oklch-safe-hk(0.7 0.2 30)", { model: "delta" })).toBe("oklch(0.679 0.2 30)");
  });
});

describe("plugin hygiene", () => {
  it("leaves unrelated values untouched", () => {
    expect(value("oklch(0.7 0.2 30)")).toBe("oklch(0.7 0.2 30)");
    expect(value("red")).toBe("red");
  });

  it("respects custom function names and options", () => {
    const out = value("hk(0.7 0.2 30)", { safeHkName: "hk", chromaCap: 0.2 });
    expect(out).toBe("oklch(0.6764 0.2 30)");
  });
});
