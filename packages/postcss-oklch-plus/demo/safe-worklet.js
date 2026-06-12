/**
 * CSS Houdini Paint worklet — safe() computed LIVE, per pixel, in the browser.
 *
 * This is the "debug / experiment" surface: it runs the exact same gamut clamp as the PostCSS
 * compiler, but per-pixel at paint time instead of resampling to stops at build time. The Paint
 * canvas is sRGB, so it clamps to sRGB (the compiler emits true P3) — same math, narrower surface.
 *
 * Chrome / Safari only; Firefox has never shipped the Paint API (the page shows a fallback there).
 */

function oklchToLinSrgb(L, C, hueDeg) {
  const h = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
function inGamut(rgb) {
  return rgb[0] >= -1e-4 && rgb[0] <= 1.0001 &&
         rgb[1] >= -1e-4 && rgb[1] <= 1.0001 &&
         rgb[2] >= -1e-4 && rgb[2] <= 1.0001;
}
// exact per-(L,hue) max in-gamut chroma, by bisection (no LUT — live)
function maxChroma(L, hueDeg) {
  if (!inGamut(oklchToLinSrgb(L, 0, hueDeg))) return 0;
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinSrgb(L, mid, hueDeg))) lo = mid; else hi = mid;
  }
  return lo;
}
function gamma(c) {
  c = Math.min(1, Math.max(0, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

registerPaint('safe-field', class {
  static get inputProperties() { return ['--c']; }
  paint(ctx, size, props) {
    const chroma = parseFloat(props.get('--c')) || 0;
    const W = size.width, H = size.height, NS = 32;
    for (let x = 0; x < W; x++) {
      const hue = (x / W) * 360;
      const g = ctx.createLinearGradient(0, 0, 0, H);        // one smooth gradient per hue column
      for (let k = 0; k < NS; k++) {
        const t = k / (NS - 1), L = 1 - t;                   // full 1..0 lightness
        const c = Math.min(chroma, maxChroma(L, hue));       // live clamp
        const rgb = oklchToLinSrgb(L, c, hue).map(gamma);
        g.addColorStop(t, `rgb(${Math.round(rgb[0] * 255)} ${Math.round(rgb[1] * 255)} ${Math.round(rgb[2] * 255)})`);
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 1, H);
    }
  }
});
