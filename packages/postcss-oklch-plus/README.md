# @here.build/postcss-oklch-plus

**`oklch`, but better.** Three PostCSS color functions that lower to plain spec CSS and do the
perceptual math at *build time* — so the browser never runs trig in the frame loop.

```css
/* you write */
.btn        { background: oklch-safe(0.7 0.5 30); }
.btn-accent { background: oklch-safe-hk(0.62 0.18 255); }

/* you ship */
.btn        { background: oklch(0.7 0.2431 30); }   /* chroma clamped to the P3 boundary */
.btn-accent { background: oklch(0.5986 0.18 255); } /* + H-K lightness compensation */
```

Two functions:

| function | what it does |
|---|---|
| `oklch-safe(L C H [/ A])` | **Correct gamut clamp.** Browsers currently *clip* out-of-gamut OKLCH per-channel, which shifts the hue. This reduces chroma instead — the honest in-gamut answer. |
| `oklch-hk(L C H [/ A])` | **Helmholtz–Kohlrausch lightness compensation.** Saturated colors *look* brighter than their measured `L`; this subtracts the perceptual excess so a colored element sits level with a neutral gray at the same `L`. (No clamp — you own the gamut.) |
| `oklch-safe-hk(L C H [/ A])` | Both: H-K compensation, then the gamut clamp. |

## The trick: binding-time partial evaluation

Both functions are **binding-time aware**. Static arguments fold to constants; dynamic ones
(`var()`, `calc()`, …) stay live. The H-K math is all `cos()`/`exp()` on **hue** — so:

> **Static hue ⇒ zero runtime trig. Guaranteed.** Even when `L` or `C` animate.

```css
/* static hue, animated lightness */
--bg: oklch-safe-hk(var(--l) 0.2 30);
/*  ↓ the H-K term folds to the constant 0.0236; no cos/sin ships */
--bg: oklch(calc(var(--l) - 0.0236) min(0.35, sqrt(min(calc(var(--l) - 0.0236), 1 - calc(var(--l) - 0.0236)) / 2), 0.2) 30);
```

| inputs | result |
|---|---|
| all static | flat `oklch()` literal, all math at build |
| static hue, live L and/or C | H-K folds to a constant / linear coefficient — **no trig** |
| dynamic hue | honest fallback: emits the live `cos()/pow()` expression (the only case that pays) |

## Usage

```js
// postcss.config.js
import oklchPlus from "@here.build/postcss-oklch-plus";
export default { plugins: [oklchPlus({ /* options */ })] };
```

Options: `lightnessFactor` (H-K sign/scale, default `1`), `chromaCap` (default `0.35`), `precision`
(default `4`), `gamut` (default `"p3"`), and `safeName` / `hkName` / `safeHkName`.

### The H-K model

The H-K compensation is a **3-harmonic Fourier fit (R²=0.98) of Nayatani-1997's VAC hue term
`q(θ)`** — its perceptual *shape*, evaluated over OKLCH hue at fixed chroma, rescaled to preserve
Delta's existing compensation budget. (The *shape* is Nayatani; the *magnitude* is inherited Delta
calibration — `S_uv` and `K_Br` are normalized away.)

### The clamp tiers (`gamut`)

`"p3"` (**default**) / `"srgb"` clamp to the *real* per-(L,H) gamut boundary (the zero-dep Ottosson
tier, parity-verified against culori). Dispatch is by which of `{L, H}` are static (chroma's
binding-time is orthogonal — it only decides literal-vs-`min()`):

| | **H static** | **H dynamic** |
|---|---|---|
| **L static** | ① exact per-(L,H) max → a baked constant | ③ L-constant fallback |
| **L dynamic** | ② per-hue cusp wrap → two lines, no trig | ④ bell envelope (fallback) |

Static hue is the master key: it makes H-K free *and* unlocks the per-hue gamut shape.

`"bell"` is **not** a gamut bound. It's a hue-agnostic pole-taper + stylistic chroma cap
(`min(cap, sqrt(min(L,1−L)/2))`) that over-admits chroma vs P3 on almost every hue (up to ~6×). It
fades chroma to zero at the white/black poles (killing hue distortion at the extremes) and caps at
`chromaCap` — but it does **not** keep you in gamut. It exists only as the dynamic-hue fallback
(cases ③/④), where the true per-hue boundary can't be expressed in CSS. Don't select it expecting
in-gamut output.

The pure math is also exported from `@here.build/postcss-oklch-plus/core`
(`nayataniHueFactor`, `hkCompensation`, `maxChromaBell`, `clampChromaBell`) for non-PostCSS use —
e.g. a Houdini paint worklet doing the same clamp live in the browser.

## Honesty notes

- The H-K model fits the *shape* of Nayatani-1997's VAC hue term `q(θ)` (R²=0.98), at fixed
  chroma, re-expressed in OKLCH hue and rescaled to Delta's budget. The magnitude is Delta's, not
  Nayatani's (`S_uv`/`K_Br` dropped). It lowers to six cheap trig terms, or a baked constant for
  static hue.
- The default clamp (`gamut: "p3"`) is the real per-(L,H) gamut boundary via a zero-dep Ottosson
  port, parity-verified against culori (a dev-only oracle). `gamut: "bell"` is **not** a gamut bound
  — it's a stylistic pole-taper + cap that over-admits chroma; it's the dynamic-hue fallback only.

### Why the clamp exists — the browser bugs it routes around

- https://issues.chromium.org/issues/331666851
- https://issues.chromium.org/issues/325598621
- https://bugs.webkit.org/show_bug.cgi?id=255939
- https://github.com/web-platform-tests/interop/issues/443
- https://github.com/w3c/csswg-drafts/issues/9449

## License

[MIT](./LICENSE.md)
