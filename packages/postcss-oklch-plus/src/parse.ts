/**
 * Binding-time analysis for an `oklch`-shaped argument list. Each of L / C / H / A is classified
 * as `static` (a literal number we can compute with at build time) or `dynamic` (a `var()`,
 * `calc()`, `min()`, … expression we must carry through to runtime verbatim). This classification
 * is the whole trick: it decides what folds to a constant and what stays live.
 */

import valueParser from "postcss-value-parser";

type PNode = valueParser.Node;

export type Comp =
  | { kind: "static"; value: number }
  | { kind: "dynamic"; expr: string };

export interface OklchArgs {
  L: Comp;
  C: Comp;
  H: Comp;
  alpha: Comp | null;
}

/** Parse a literal number, resolving `%` against `percentBase` (e.g. L: 100% → 1, C: 100% → 0.4). */
function parseNumber(raw: string, percentBase: number): number | null {
  if (raw.endsWith("%")) {
    const n = Number(raw.slice(0, -1));
    return Number.isFinite(n) ? (n / 100) * percentBase : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Parse a hue literal, accepting angle units (deg/grad/rad/turn) → degrees. */
function parseHue(raw: string): number | null {
  const m = /^(-?[\d.]+(?:e-?\d+)?)(deg|grad|rad|turn)?$/i.exec(raw);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  switch ((m[2] ?? "").toLowerCase()) {
    case "grad": return n * 0.9;
    case "rad": return (n * 180) / Math.PI;
    case "turn": return n * 360;
    default: return n; // deg or unitless
  }
}

function compFromNode(node: PNode, percentBase: number, isHue = false): Comp {
  if (node.type === "word") {
    const num = isHue ? parseHue(node.value) : parseNumber(node.value, percentBase);
    if (num !== null) return { kind: "static", value: num };
    // keyword (`none`) or anything non-numeric → carry through untouched
    return { kind: "dynamic", expr: node.value };
  }
  // function (calc/var/min/clamp/env/…) or string → dynamic
  return { kind: "dynamic", expr: valueParser.stringify(node) };
}

/** True when a component is the CSS `none` keyword (legal in oklch() but not inside math). */
export function isNone(c: Comp): boolean {
  return c.kind === "dynamic" && c.expr.trim().toLowerCase() === "none";
}

/**
 * Extract `L C H [/ A]` from the children of a parsed function node. Returns `null` if the shape
 * isn't a 3-component oklch (in which case the caller leaves the value untouched).
 */
export function parseOklchArgs(nodes: PNode[]): OklchArgs | null {
  const main: PNode[] = [];
  const alpha: PNode[] = [];
  let afterSlash = false;
  for (const n of nodes) {
    if (n.type === "space") continue;
    if (n.type === "div" && n.value === "/") {
      afterSlash = true;
      continue;
    }
    (afterSlash ? alpha : main).push(n);
  }
  if (main.length !== 3) return null;
  const [l, c, h] = main as [PNode, PNode, PNode];
  return {
    L: compFromNode(l, 1),
    C: compFromNode(c, 0.4),
    H: compFromNode(h, 1, true),
    alpha: alpha.length === 1 ? compFromNode(alpha[0] as PNode, 1) : null,
  };
}
