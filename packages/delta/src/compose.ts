import type * as delta from "./index.js";

// Type exports for Delta design system
export type DeltaEmphasis = "accent" | "success" | "error" | "info" | "variant" | "data" | "danger" | "warning";
export type DeltaDensity = "compact" | "small" | "default" | "large" | "spacious";
export type DeltaAffinity = "intimate" | "affine" | "default" | "unrelated" | "antiaffine";
export type DeltaProminence = "ambient" | "default" | "strong";
export type DeltaShape = "square" | "square-large" | "pill";
export type DeltaSurface = "canvas" | "base" | "raised";

// Legacy type export - use raw classes instead
export type DeltaElementProps = {
  bordered?: boolean;
  filled?: boolean;
  emphasis?: DeltaEmphasis;
  density?: DeltaDensity;
  prominence?: DeltaProminence;
  shape?: DeltaShape;
  surface?: DeltaSurface;
  supportsHover?: boolean;
  supportsCheck?: boolean;
  supportsActive?: boolean;
  fullBleed?: boolean;
  tight?: boolean;
  element?: boolean;
  elementConfiguration?: boolean;
  elementApplication?: boolean;
} & {
  [key in keyof typeof delta.forceInteractivityStates]?: boolean;
};
