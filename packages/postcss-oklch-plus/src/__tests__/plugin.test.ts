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

describe("oklch-safe (gamut clamp only, P3 default)", () => {
  it("bakes a static color to the exact P3-clamped literal", () => {
    expect(value("oklch-safe(0.7 0.5 30)")).toBe("oklch(0.7 0.2431 30)");
  });

  it("passes through chroma already in gamut", () => {
    expect(value("oklch-safe(0.7 0.1 30)")).toBe("oklch(0.7 0.1 30)");
  });

  it("uses the per-hue cusp wrap (not bell) when L is dynamic", () => {
    const out = value("oklch-safe(var(--l) 0.2 30)");
    expect(out).not.toContain("sqrt(");            // P3 cusp triangle, not the bell envelope
    expect(out).toContain("(1 - var(--l))");
    expect(out).toContain("var(--l)");
  });

  it("preserves alpha", () => {
    expect(value("oklch-safe(0.7 0.5 30 / 0.5)")).toBe("oklch(0.7 0.2431 30 / 0.5)");
  });
});

describe("safe() / safe-hk() — canonical names + oklch() wrapper", () => {
  it("safe is an alias for the gamut clamp", () => {
    expect(value("safe(0.7 0.5 30)")).toBe(value("oklch-safe(0.7 0.5 30)"));
  });
  it("safe-hk wraps a full oklch() color", () => {
    expect(value("safe-hk(oklch(0.7 0.2 30))")).toBe(value("oklch-safe-hk(0.7 0.2 30)"));
  });
  it("safe() unwraps oklch() and clamps to P3", () => {
    expect(value("safe(oklch(0.7 0.5 30))")).toBe("oklch(0.7 0.2431 30)");
  });
  it("safe-hk with literal hue is trig-free even with var L/C", () => {
    const out = value("safe-hk(oklch(var(--l) var(--c) 30))");
    expect(out).not.toContain("cos(");
    expect(out).toContain("var(--l)");
  });
});

describe("emission guards", () => {
  it("accepts angle-unit hue as static (folds, no trig)", () => {
    const out = value("oklch-hk(0.7 0.2 30deg)");
    expect(out).not.toContain("cos(");
    expect(out).toBe(value("oklch-hk(0.7 0.2 30)")); // 30deg === 30
  });

  it("folds turn/grad/rad hue units", () => {
    expect(value("oklch-hk(0.7 0.2 0.25turn)")).toBe(value("oklch-hk(0.7 0.2 90)"));
  });

  it("passes `none` channels through untouched (no broken math)", () => {
    expect(value("oklch-safe(0.7 none 30)")).toBe("oklch(0.7 none 30)");
    expect(value("oklch-hk(none 0.2 30)")).toBe("oklch(none 0.2 30)");
    expect(value("oklch-safe-hk(0.7 0.2 none)")).toBe("oklch(0.7 0.2 none)");
  });

  it("never emits NaN for out-of-range lightness", () => {
    expect(value("oklch-safe(-0.5 0.2 30)", { gamut: "bell" })).not.toContain("NaN");
    expect(value("oklch-safe(1.5 0.2 30)")).not.toContain("NaN");
  });

  it("warns on malformed arity instead of shipping an unknown function", () => {
    const res = postcss([plugin()]).process("a{color:oklch-safe(0.7 0.2 30 40)}", { from: undefined });
    expect(res.warnings().length).toBe(1);
    expect(res.css).toContain("oklch-safe(0.7 0.2 30 40)"); // left untouched, but flagged
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
});

describe("plugin hygiene", () => {
  it("leaves unrelated values untouched", () => {
    expect(value("oklch(0.7 0.2 30)")).toBe("oklch(0.7 0.2 30)");
    expect(value("red")).toBe("red");
  });

  it("respects chromaCap on oklch-safe", () => {
    expect(value("oklch-safe(0.7 0.5 30)", { chromaCap: 0.2 })).toBe("oklch(0.7 0.2 30)");
  });
});
