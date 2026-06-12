/**
 * The gamut model is an injectable interface so the lowering stays implementation-agnostic: today
 * it's backed by culori (the trusted reference); tomorrow by a ported Ottosson implementation, and
 * we diff the two for parity. `null` means "no model" → fall back to the zero-dep bell wrap.
 *
 * Both methods return TRUE (uncapped) gamut chroma; the caller applies its own `chromaCap`.
 */
export interface GamutModel {
  /** Largest in-gamut chroma at lightness `L` and `hue` (degrees). */
  maxChroma(L: number, hue: number): number;
  /** The cusp: the max-chroma point over all L for this hue. */
  cusp(hue: number): { L: number; C: number };
}
