/*single-choice usages*/

export const emphasis = {
  accent: "Δemphasis-accent",
  success: "Δemphasis-success",
  error: "Δemphasis-error",
  info: "Δemphasis-info",
  variant: "Δemphasis-variant",
  data: "Δemphasis-data",
  danger: "Δemphasis-danger",
  warning: "Δemphasis-warning",
} as const;

export const density = {
  compact: "Δdensity-compact",
  small: "Δdensity-small",
  default: "Δdensity-default",
  large: "Δdensity-large",
  spacious: "Δdensity-spacious",
} as const;

export const prominence = {
  strong: "Δprominence-strong",
  default: "Δprominence-default",
  ambient: "Δprominence-ambient",
} as const;

export const interactivity = {
  hover: "Δhoverable",
  check: "Δcheckable",
  active: "Δactivable",
} as const;

export const forceInteractivityStates = {
  hover: "Δis-hover",
  checked: "Δis-checked",
  active: "Δis-active",
};

export const shapes = {
  square: "Δshape-square",
  pill: "Δshape-pill",
} as const;

export const presence = {
  dimmer: "Δdimmer",
  context: "Δpresence-context",
  scope: "Δpresence-scope",
  zone: "Δpresence-zone",
  target: "Δpresence-target",
} as const;

export { Chroma as Chroma } from "./chroma.js";
export type { RGB as RGB, HSL as HSL } from "./chroma.js";
