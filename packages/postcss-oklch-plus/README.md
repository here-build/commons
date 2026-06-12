# @here.build/postcss-oklch-plus

**`oklch`, but better.** Two PostCSS color functions that lower to plain spec CSS and do the
perceptual math at *build time* — so the browser never runs trig in the frame loop.

```css
/* you write */
.btn        { background: oklch-safe(0.7 0.5 30); }
.btn-accent { background: oklchhk(0.62 0.18 255); }

/* you ship */
.btn        { background: oklch(0.7 0.35 30); }
.btn-accent { background: oklch(0.5876 0.18 255); }
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
/*  ↓ the H-K term folds to the constant 0.021; no cos/pow ships */
--bg: oklch(calc(var(--l) - 0.021) min(0.35, sqrt(min(calc(var(--l) - 0.021), 1 - calc(var(--l) - 0.021)) / 2), 0.2) 30);
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

Options: `lightnessFactor` (H-K sign/scale, default `1`), `chromaCap` (default `0.35`),
`precision` (default `4`), `gamut` (default `"bell"`), and `safeName` / `hkName` / `safeHkName`.

### The clamp tiers (`gamut`)

`"bell"` (default) is a zero-dep, hue-agnostic wrap — the safe last resort. `"p3"` / `"srgb"`
turn on **per-variance precision**, governed by which of `{L, H}` are static (chroma's binding-time
is orthogonal — it only decides literal-vs-`min()`):

| | **H static** | **H dynamic** |
|---|---|---|
| **L static** | ① exact per-(L,H) max → a baked constant | ③ bell collapses to an L-constant |
| **L dynamic** | ② per-hue cusp wrap → two lines, no trig | ④ global bell (last resort) |

Static hue is the master key: it makes H-K free *and* unlocks the per-hue gamut shape. The precise
tiers are also *more correct* than the bell — e.g. deep blue has far less P3 chroma than the bell's
flat cap admits, so `gamut: "p3"` clamps it where the bell would leak.

> The precise tiers currently use culori as the gamut oracle. A zero-dep Ottosson port is landing
> next, validated for parity against culori — after which culori becomes a dev-only dependency.

The pure math is also exported from `@here.build/postcss-oklch-plus/core`
(`deltaHueFactor`, `hkCompensation`, `maxChromaBell`, `clampChromaBell`) for non-PostCSS use —
e.g. a Houdini paint worklet doing the same clamp live in the browser.

## Honesty notes

- The H-K model is a **simplified Nayatani**: it keeps Nayatani's two-peak structure (warm-hue
  lobe + independent blue bump) but reduces it to an O(1) cosine + Gaussian so it lowers to cheap
  CSS instead of melting the style engine. Not naive, not the full VAC/VCC integral — simplified
  on purpose.
- The gamut clamp is the bell-curve bound `min(cap, sqrt(min(L, 1−L)/2))`, not a full color-space
  gamut map. It's fast, dependency-free, and keeps you inside P3 — which is the part browsers get
  wrong. An accurate-gamut-map option (via a color library) is a planned opt-in.

### Why the clamp exists — the browser bugs it routes around

- https://issues.chromium.org/issues/331666851
- https://issues.chromium.org/issues/325598621
- https://bugs.webkit.org/show_bug.cgi?id=255939
- https://github.com/web-platform-tests/interop/issues/443
- https://github.com/w3c/csswg-drafts/issues/9449

## License

FSL-1.1-MIT
