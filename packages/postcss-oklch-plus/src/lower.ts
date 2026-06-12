/**
 * The partial evaluator, as two independent, composable stages:
 *
 *   hkAdjustL  — subtract the Helmholtz-Kohlrausch lightness compensation from L
 *   clampChroma — reduce chroma to the in-gamut bound
 *
 * Three public functions compose them:
 *
 *   oklch-safe(L C H)     = clampChroma                 (gamut clamp only)
 *   oklch-hk(L C H)       = hkAdjustL                   (H-K only, caller owns gamut)
 *   oklch-safe-hk(L C H)  = clampChroma ∘ hkAdjustL     (both)
 *
 * Both stages are binding-time aware. The two governing facts:
 *
 *   - H-K trig is a pure function of HUE → static hue ⇒ zero runtime trig (always).
 *   - clamp precision is governed by which of {L, H} are static (see the strategy table in
 *     `clampChroma`). Chroma's binding-time only decides literal-vs-`min()`, never the bound.
 */

import {
  clampChromaBell,
  clampChromaBellCss,
  maxChromaBell,
  clamp,
  HK_K,
} from "./core.js";
import type { Comp, OklchArgs } from "./parse.js";
import type { GamutModel } from "./gamut.js";
import type { HueModel } from "./core.js";

export interface LowerOptions {
  lightnessFactor: number;
  chromaCap: number;
  precision: number;
  /** Hue model for the H-K compensation (default: corrected Nayatani). */
  hue: HueModel;
  /** Gamut model for the precise clamp tiers; `null` → the zero-dep bell wrap. */
  gamut: GamutModel | null;
}

export interface LowerResult {
  css: string;
  /** true only when hue was dynamic and we had to emit live trig. */
  usedRuntimeTrig: boolean;
}

function fmt(n: number, precision: number): string {
  return String(Number(n.toFixed(precision)));
}

function asExpr(c: Comp, precision: number): string {
  return c.kind === "static" ? fmt(c.value, precision) : c.expr;
}

function emit(L: Comp, C: Comp, H: Comp, alpha: Comp | null, precision: number): string {
  const head = `${asExpr(L, precision)} ${asExpr(C, precision)} ${asExpr(H, precision)}`;
  return alpha === null ? `oklch(${head})` : `oklch(${head} / ${asExpr(alpha, precision)})`;
}

/* ---------------------------------------------------------------- H-K stage */

/** Subtract the H-K compensation from L. Returns the adjusted L and whether live trig was needed. */
function hkAdjustL(args: OklchArgs, opts: LowerOptions): { L: Comp; usedRuntimeTrig: boolean } {
  const { lightnessFactor, precision } = opts;
  const k = lightnessFactor * HK_K;
  const Lbase = asExpr(args.L, precision);

  if (args.H.kind === "static") {
    const hf = opts.hue.factor(args.H.value);

    if (args.C.kind === "static") {
      // hue + chroma static → H-K is a single constant
      const hk = k * args.C.value * hf;
      const L: Comp =
        args.L.kind === "static"
          ? { kind: "static", value: args.L.value - hk }
          : { kind: "dynamic", expr: `calc(${Lbase} - ${fmt(hk, precision)})` };
      return { L, usedRuntimeTrig: false };
    }

    // hue static, chroma live → H-K is linear in C (coefficient folded), still no trig
    const coef = fmt(k * hf, precision);
    return {
      L: { kind: "dynamic", expr: `calc(${Lbase} - ${coef} * ${asExpr(args.C, precision)})` },
      usedRuntimeTrig: false,
    };
  }

  // hue dynamic → pay live trig (the hue-model formula, evaluated at runtime on a lowered leaf)
  const hkExpr = `calc(${fmt(k, precision)} * ${asExpr(args.C, precision)} * ${opts.hue.factorCss(asExpr(args.H, precision))})`;
  return {
    L: { kind: "dynamic", expr: `calc(${Lbase} - ${hkExpr})` },
    usedRuntimeTrig: true,
  };
}

/* -------------------------------------------------------------- clamp stage */

/**
 * Reduce chroma to the in-gamut bound. Precision is governed by which of {L, H} are static — a
 * 2×2 — with chroma's binding-time orthogonal (it only decides literal-vs-`min()`):
 *
 *            H static                          H dynamic
 *   L static  ① exact per-(L,H) max → const     ③ bell collapses to an L-constant
 *   L dynamic ② per-hue cusp wrap (2 lines)      ④ global bell (last resort)
 *
 * ① and ② need a gamut model and a static hue; ③/④ use the hue-agnostic bell.
 */
function clampChroma(L: Comp, C: Comp, H: Comp, opts: LowerOptions): Comp {
  const { chromaCap, precision, gamut } = opts;

  // ① / ② — precise tiers: require a gamut model AND a known hue
  if (gamut && H.kind === "static") {
    if (L.kind === "static") {
      // ① exact: a single baked constant
      const m = Math.min(chromaCap, gamut.maxChroma(L.value, H.value));
      return C.kind === "static"
        ? { kind: "static", value: Math.min(m, C.value) }
        : { kind: "dynamic", expr: `min(${fmt(m, precision)}, ${asExpr(C, precision)})` };
    }
    // ② per-hue cusp wrap — the min() of the two cusp-anchored lines IS the triangle (no trig)
    const peak = gamut.cusp(H.value);
    const Cc = Math.min(chromaCap, peak.C);
    const Lc = clamp(1e-3, peak.L, 1 - 1e-3);
    const Lexpr = asExpr(L, precision);
    const rising = `${fmt(Cc / Lc, precision)} * ${Lexpr}`;
    const falling = `${fmt(Cc / (1 - Lc), precision)} * (1 - ${Lexpr})`;
    return {
      kind: "dynamic",
      expr: `min(${asExpr(C, precision)}, calc(${rising}), calc(${falling}))`,
    };
  }

  // ③ / ④ — bell wrap (hue dynamic, or no gamut model)
  if (L.kind === "static" && C.kind === "static") {
    return { kind: "static", value: clampChromaBell(L.value, C.value, chromaCap) };
  }
  if (L.kind === "static") {
    // ③ L known → max-chroma bound is a constant, clamp stays a cheap min()
    const m = maxChromaBell(L.value, chromaCap);
    return { kind: "dynamic", expr: `min(${fmt(m, precision)}, ${asExpr(C, precision)})` };
  }
  // ④ L live → keep the whole bell live (still cheap — no trig)
  const Lexpr = asExpr(L, precision);
  return { kind: "dynamic", expr: clampChromaBellCss(Lexpr, asExpr(C, precision), chromaCap) };
}

/* ------------------------------------------------------------ public lowers */

/** `oklch-safe(...)`: correct gamut clamp only — "oklch but better". */
export function lowerSafe(args: OklchArgs, opts: LowerOptions): LowerResult {
  const C = clampChroma(args.L, args.C, args.H, opts);
  return { css: emit(args.L, C, args.H, args.alpha, opts.precision), usedRuntimeTrig: false };
}

/** `oklch-hk(...)`: Helmholtz-Kohlrausch compensation only — caller owns the gamut. */
export function lowerHk(args: OklchArgs, opts: LowerOptions): LowerResult {
  const { L, usedRuntimeTrig } = hkAdjustL(args, opts);
  return { css: emit(L, args.C, args.H, args.alpha, opts.precision), usedRuntimeTrig };
}

/** `oklch-safe-hk(...)`: H-K compensation, then correct gamut clamp. */
export function lowerSafeHk(args: OklchArgs, opts: LowerOptions): LowerResult {
  const { L, usedRuntimeTrig } = hkAdjustL(args, opts);
  const C = clampChroma(L, args.C, args.H, opts);
  return { css: emit(L, C, args.H, args.alpha, opts.precision), usedRuntimeTrig };
}
