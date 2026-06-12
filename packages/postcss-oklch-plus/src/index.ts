/**
 * @here.build/postcss-oklch-plus
 *
 * Two custom color functions that lower to plain spec CSS, doing as much of the perceptual math
 * as possible at build time:
 *
 *   oklch-safe(L C H [/ A])   correctly gamut-clamped oklch (fixes browser per-channel clipping)
 *   oklchhk(L C H [/ A])      + Helmholtz-Kohlrausch lightness compensation
 *
 * Both are binding-time aware: static arguments fold to constants; dynamic ones (var/calc/…) stay
 * live. Static hue ⇒ zero runtime trig, guaranteed.
 */

import type { Plugin } from "postcss";
import valueParser from "postcss-value-parser";
import { parseOklchArgs } from "./parse.js";
import { lowerSafe, lowerHk, lowerSafeHk, type LowerOptions, type LowerResult } from "./lower.js";
import type { OklchArgs } from "./parse.js";
import { ottossonGamut } from "./gamut-ottosson.js";
import type { GamutModel } from "./gamut.js";
import { HUE_MODELS } from "./core.js";

export interface PluginOptions {
  /**
   * H-K hue model. `"nayatani"` (default) = corrected 3-harmonic Nayatani-1997 fit. `"delta"` =
   * legacy here.build curve, kept only for output parity (perceptually miscalibrated).
   */
  model?: "nayatani" | "delta";
  /** Sign/scale of the H-K compensation (Delta's `--⚙️lightness-factor`). Default 1. */
  lightnessFactor?: number;
  /** Max chroma cap for the gamut clamp. Default 0.35. */
  chromaCap?: number;
  /** Decimal places for emitted literals. Default 4. */
  precision?: number;
  /**
   * Clamp target. `"p3"` (default) / `"srgb"` = the verified per-(L,H) gamut clamp (zero-dep
   * Ottosson tier). `"bell"` = the hue-agnostic pole-taper + stylistic cap — NOT a gamut guarantee,
   * over-permissive vs P3; reserved for the dynamic-hue fallback. Default is `"p3"`.
   */
  gamut?: "bell" | "p3" | "srgb";
  /** Function name for gamut clamp only. Default "oklch-safe". */
  safeName?: string;
  /** Function name for H-K compensation only. Default "oklch-hk". */
  hkName?: string;
  /** Function name for H-K + clamp. Default "oklch-safe-hk". */
  safeHkName?: string;
}

/** Turn a parsed function node into a verbatim word node holding the lowered CSS. */
function replaceWithLiteral(node: valueParser.Node, css: string): void {
  const mut = node as unknown as {
    type: string;
    value: string;
    nodes?: unknown;
    before?: unknown;
    after?: unknown;
  };
  mut.type = "word";
  mut.value = css;
  delete mut.nodes;
  delete mut.before;
  delete mut.after;
}

const creator = (options: PluginOptions = {}): Plugin => {
  const gamutChoice = options.gamut ?? "p3";
  const gamut: GamutModel | null =
    gamutChoice === "srgb" ? ottossonGamut("srgb") : gamutChoice === "bell" ? null : ottossonGamut("p3");

  const opts: LowerOptions = {
    lightnessFactor: options.lightnessFactor ?? 1,
    chromaCap: options.chromaCap ?? 0.35,
    precision: options.precision ?? 4,
    hue: HUE_MODELS[options.model ?? "nayatani"],
    gamut,
  };
  const lowerers: Record<string, (args: OklchArgs, o: LowerOptions) => LowerResult> = {
    [options.safeName ?? "oklch-safe"]: lowerSafe,
    [options.hkName ?? "oklch-hk"]: lowerHk,
    [options.safeHkName ?? "oklch-safe-hk"]: lowerSafeHk,
  };
  const names = Object.keys(lowerers);

  return {
    postcssPlugin: "postcss-oklch-plus",
    Declaration(decl, { result }) {
      if (!names.some((n) => decl.value.includes(n))) return;
      const parsed = valueParser(decl.value);
      let changed = false;

      parsed.walk((node): boolean | void => {
        if (node.type !== "function") return;
        const lower = lowerers[node.value];
        if (!lower) return;
        const args = parseOklchArgs(node.nodes);
        if (!args) {
          decl.warn(result, `${node.value}() expects "L C H [/ A]" — got ${valueParser.stringify(node)}`);
          return false;
        }
        replaceWithLiteral(node, lower(args, opts).css);
        changed = true;
        return false; // don't descend into the replaced literal
      });

      if (changed) decl.value = parsed.toString();
    },
  };
};

creator.postcss = true;

export default creator;
export type { LowerOptions } from "./lower.js";
export type { GamutModel } from "./gamut.js";
export { ottossonGamut } from "./gamut-ottosson.js";
export * from "./core.js";
