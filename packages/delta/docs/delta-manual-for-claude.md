---
title: delta manual for claude
genre: reference
status: current
tags: [delta, css, dx, design-science]
created: 2025-11-29
updated: 2026-04-27
---

# Delta Design System: A Manual for Claude Instances

## The One-Paragraph Essence

Delta is a CSS design grammar with two APIs: a **class-level API** (LaTeX meets Prolog - you declare semantic facts, constraint mathematics derive presentation) and a **var-level API** (intermediate representation of render intent - computed values you wire to wherever they're needed). Unlike rigid design systems that bundle computation and application, Delta separates them: classes trigger computation, CSS custom properties hold the results, and YOU decide where to apply them. This makes Delta hackable by design - there's no "correct" usage to fight against, only computed intent to route.

---

## The Two APIs

### Class API: Semantic Declaration (LaTeX + Prolog)

You declare WHAT things ARE, not how they look:

```html
<button class="Δaction Δhoverable Δfilled Δemphasis-accent">
```

This states facts:
- This IS an action (triggers behavior)
- It CAN be hovered (responds to mouse)
- It IS filled (solid background style)
- Its emphasis IS accent (primary brand color)

Delta's constraint mathematics derive everything else: colors, padding, border-radius, hover states, focus rings, transitions.

### Var API: Computed Render Intent (IR)

After class declaration, CSS custom properties hold computed intent:

```css
--padding: 8px;
--padding-top: 6px;  /* adjusted for border */
--background-color: oklch(0.35 0.15 211);
--border-radius: 4px;
--border-color: oklch(0.35 0.15 211 / 0.7);
--text-color: oklch(0.96 0 211);
--transition-duration: 150ms;
--line-height: 20px;
--icon-size: 20px;
/* ... and many more */
```

These are NOT styles - they're **render intent**. You route them where needed:

```jsx
// Parent computes but doesn't apply padding
<div class="Δdisplay Δbordered" style={{ padding: 0 }}>
  {/* Child picks up the computed padding */}
  <div style={{ padding: 'var(--padding)' }}>
    Content with proper spacing
  </div>
</div>
```

---

## Class API Reference

### Entities: What Something IS

| Class | Intent Factor | Meaning |
|-------|---------------|---------|
| `Δaction` | 0 | Triggers behavior (buttons, links, clickable elements) |
| `Δcontrol` | -1 | Manipulates values (inputs, sliders, toggles) |
| `Δgroup` | -2 | Contains similar entities (button groups, toolbars) |
| `Δdisplay` | -3 | Shows information (badges, labels, status) |
| `Δcontainer` | — | Virtual element: computation point without visual styles |

Intent factor affects visual weight automatically. A `Δdisplay` with accent emphasis is more muted than a `Δaction` with the same emphasis.

**Δcontainer Example:**
```jsx
{/* Need Delta's computed values but applying to custom component */}
<div class="Δcontainer Δdensity-large Δemphasis-accent">
  <MyCustomCanvas style={{
    padding: 'var(--padding)',
    '--accent': 'var(--color-emphasis)'  // Pass to custom property
  }} />
</div>
```
Use `Δcontainer` when you want computation without Delta's visual styles.

### Surfaces: Context Containers

| Class | Lightness | Use |
|-------|-----------|-----|
| `Δsurface-canvas` | 0.04 | Darkest background (app chrome) |
| `Δsurface-base` | 0.18 | Default surface |
| `Δsurface-raised` | 0.24 | Elevated surface |
| `Δoverlay` | 0.24 | Modals, tooltips, menus (special border/shadow treatment) |

Surfaces establish `--🔧lightness-surface` for their subtree, affecting all color computations within.

### Capabilities: What It CAN DO

| Class | Effect | State Variable |
|-------|--------|----------------|
| `Δhoverable` | Responds to mouse hover | `--hovered` |
| `Δfocusable` | Takes keyboard focus (shows focus ring) | `--focused` |
| `Δactivable` | Responds to press/click | `--active` |
| `Δcheckable` | Has checked/unchecked state | `--checked` |

Capabilities enable state-based styling. Without `Δhoverable`, hover does nothing.

**Forcing States Programmatically:**

Use `.Δis-*` classes to force a state without actual interaction:

| Force Class | Equivalent to |
|-------------|---------------|
| `Δis-hover` | Being hovered |
| `Δis-active` | Being pressed |
| `Δis-checked` | Being checked |

Example - selected item in a list:
```html
<div class="Δgroup Δvertical">
  <button class="Δaction Δhoverable Δcheckable Δbordered">Item A</button>
  <button class="Δaction Δhoverable Δcheckable Δbordered Δis-checked">Item B (selected)</button>
  <button class="Δaction Δhoverable Δcheckable Δbordered">Item C</button>
</div>
```

The `Δis-checked` forces the visual state; `Δcheckable` declares the capability.

### Visual Style

| Class | Effect |
|-------|--------|
| `Δfilled` | Solid background using emphasis color |
| `Δbordered` | Visible border |
| (neither) | Ghost style - transparent until interaction |

### Emphasis: Semantic Color (Parametrized Trait)

| Class | Hue | Chroma Level | Use |
|-------|-----|--------------|-----|
| (default) | neutral | minimal | Standard UI |
| `Δemphasis-accent` | 211 (blue) | primary | Primary actions, brand |
| `Δemphasis-success` | 142 (green) | tertiary | Positive outcomes |
| `Δemphasis-info` | 195 (cyan) | tertiary | Informational |
| `Δemphasis-warning` | 110 (yellow) | primary | Caution |
| `Δemphasis-danger` | 35 (orange) | primary | Destructive actions |
| `Δemphasis-error` | 30 (red) | secondary | Errors |
| `Δemphasis-variant` | 285 (purple) | secondary | Special contexts |
| `Δemphasis-data` | 195 (cyan) | secondary | Data visualization |

### Density: Spacing Scale (Parametrized Trait, Linear Range)

```
compact ←― small ←― default ―→ large ―→ spacious
  -1        0         1          2         3
```

| Class | Factor | Effect |
|-------|--------|--------|
| `Δdensity-compact` | -1 | Tight spacing |
| `Δdensity-small` | 0 | Reduced spacing |
| `Δdensity-default` | 1 | Standard spacing |
| `Δdensity-large` | 2 | Generous spacing |
| `Δdensity-spacious` | 3 | Maximum spacing |

Density affects BOTH spacing AND font size together.

### Scale: Font Size Only (Parametrized Trait, Linear Range)

```
xs ←― small ←― default ―→ large ―→ xl
-2      -1        0          1       2
```

Scale is orthogonal to density - adjust font size without changing spacing.

**Combining Density and Scale:**
```html
<!-- Compact spacing but large text (accessibility) -->
<div class="Δdensity-compact Δscale-large">

<!-- Spacious layout but small text (data-dense table) -->
<div class="Δdensity-spacious Δscale-small">
```

### Prominence: Visual Weight (Parametrized Trait)

| Class | Effect |
|-------|--------|
| `Δprominence-ambient` | Subtle, informational |
| `Δprominence-default` | Standard weight |
| `Δprominence-strong` | High visual weight |

Prominence affects lightness modifier, chroma modifier, and text chroma.

### Affinity: Internal Proximity (Parametrized Trait)

| Class | Factor | Effect |
|-------|--------|--------|
| `Δaffinity-intimate` | 2 | Very tight internal spacing |
| `Δaffinity-affine` | 1 | Related items |
| `Δaffinity-default` | 0 | Standard |
| `Δaffinity-unrelated` | -1 | Loose grouping |

Affinity affects gap computation. The formula:
```
gap-factor = density-factor + scale-factor - affinity-factor
```

So `Δdensity-spacious` (3) + `Δaffinity-intimate` (2) = gap-factor of 1 (3 + 0 - 2).
Higher affinity = tighter gaps (it subtracts from the total).

### Shape Modifiers

| Class | Effect |
|-------|--------|
| `Δshape-square` | Equal padding (vertical matches horizontal) |
| `Δshape-square-large` | Equal padding (horizontal matches vertical) |
| `Δshape-pill` | Maximum border radius (pill shape) |

---

## Layout Classes

### Δlayout - Flex Container

```html
<div class="Δlayout">         <!-- Horizontal by default -->
<div class="Δlayout Δvertical">  <!-- Vertical -->
```

- Gap computed from density/scale/affinity factors
- First/last non-element children get padding adjustments for edge alignment

### Δgroup - Connected Elements

```html
<div class="Δgroup">
  <button class="Δaction Δbordered">A</button>
  <button class="Δaction Δbordered">B</button>
  <button class="Δaction Δbordered">C</button>
</div>
```

Automatic border collapsing:
- Internal borders halved between elements
- Corner radius only on first/last
- Hover z-index management
- Works vertically with `Δvertical`

### Δstack - Layered Elements

```html
<div class="Δstack">
  <div>Background layer</div>
  <div>Foreground layer</div>
</div>
```

Grid-based stacking where all children occupy the same area.

### Δgrid - CSS Grid

```html
<div class="Δgrid">
```

Standard grid with computed gap values.

---

## Typography

### Font pairing

Delta uses two fonts:
- **Source Sans 3** (`--font-sans`) — body, UI, captions, labels. Rational, humanist, optimized for reading.
- **Nunito Sans** (`--font-heading`) — display/hierarchy text. Rounded geometric with `opsz` axis. Used with `font-variant-caps: all-petite-caps`.

### Inverse weight scaling

Bigger text = lighter weight. This is the historically correct optical sizing principle (500 years of punchcutting), not the CSS `h1 { font-weight: bold }` convention. Formula: `base-weight × pow(0.8, font-factor)`.

| Element | Factor | Dark surface weight |
|---------|--------|-------------------|
| Caption | -1 | 450 (heavier — small text needs it) |
| Body/UI | 0 | 360 (base) |
| h3 | 1 | 288 (lighter) |
| h2 | 2 | 230 (light) |
| h1 | 3 | 184 (very light) |

Why it works: petite caps are already dense, Delta's spacing handles hierarchy, information density is inverse to visual size, and dark surfaces make light text appear heavier (irradiation illusion).

### Δtext with Roles

```html
<span class="Δtext Δrole-display Δhierarchy-1">Heading</span>
<span class="Δtext Δrole-body">Paragraph text</span>
<span class="Δtext Δrole-ui">Interface text</span>
<span class="Δtext Δrole-label">LABEL</span>
<span class="Δtext Δrole-caption">Caption</span>
<span class="Δtext Δrole-code">monospace</span>
<span class="Δtext Δrole-shortcut">⌘K</span>
```

### Hierarchy (for display role)

| Class | Font Factor | Font | Weight direction |
|-------|-------------|------|-----------------|
| `Δhierarchy-1` | 3 (largest) | Nunito Sans | Lightest |
| `Δhierarchy-2` | 2 | Nunito Sans | Light |
| `Δhierarchy-3` | 1 | Nunito Sans | Medium-light |
| `Δhierarchy-4` | 0 | Nunito Sans | Base |

### Text Importance

| Class | Effect |
|-------|--------|
| `Δimportance-high` | Primary text color |
| `Δimportance-normal` | Secondary text color |
| `Δimportance-low` | Tertiary text color |

---

## Var API Reference

### Spacing Variables (computed, exposed)

| Variable | Meaning |
|----------|---------|
| `--padding` | Full padding shorthand |
| `--padding-top`, `--padding-right`, etc. | Individual padding (border-adjusted) |
| `--padding-top-borderless`, etc. | Padding before border adjustment |
| `--gap-x`, `--gap-y`, `--gap` | Gap values for layouts |

### Color Variables (computed, exposed)

| Variable | Meaning |
|----------|---------|
| `--background-color` | Element background |
| `--background-color-surface` | Surface background |
| `--border-color` | Border color |
| `--text-color` | Text color for this context |
| `--color-text-primary` | Brightest text (0.96 lightness) |
| `--color-text-secondary` | Medium text (0.70 lightness) |
| `--color-text-tertiary` | Subtle text (0.50 lightness) |
| `--color-emphasis` | The emphasis color |
| `--color-emphasis-interactive` | Emphasis with hover/active adjustment |

### Size Variables (computed, exposed)

| Variable | Meaning |
|----------|---------|
| `--font-size` | Computed font size |
| `--line-height` | Computed line height (grid-snapped) |
| `--icon-size` | Icon size (matches line-height) |
| `--border-radius` | Full radius shorthand |
| `--border-top-left-radius`, etc. | Individual corner radii |
| `--border-width`, `--border-top-width`, etc. | Border widths |

### State Variables (0 or 1, for calculations)

| Variable | When 1 |
|----------|--------|
| `--hovered` | Element is hovered |
| `--focused` | Element has focus |
| `--active` | Element is pressed |
| `--checked` | Element is checked |

Use these for conditional CSS calculations:
```css
/* Show something only when hovered */
opacity: var(--hovered);

/* Offset position when active */
transform: translateY(calc(var(--active) * 2px));

/* Conditional color mixing */
background: color-mix(in oklch, var(--color-a), var(--color-b) calc(var(--checked) * 100%));
```

### Transition Variables

| Variable | Meaning |
|----------|---------|
| `--transition-property` | What transitions |
| `--transition-duration` | How long (150ms default) |
| `--transition-delay` | Delay before transition |

---

## Wiring Patterns

### When to Use Property Splitting

Default Delta application works for most cases. Split properties when:

1. **Visual effects require layer separation** - backdrop-filter, mix-blend-mode, overflow:hidden need their own element
2. **Different children need different parts** - border on container, background on footer
3. **Pseudo-elements need computed values** - `::before`/`::after` can't have classes
4. **Custom components don't accept Delta classes** - pass vars via inline styles

If Delta's default looks right, don't split. Split only when default application doesn't achieve your layout.

### Property Splitting

Parent computes, children apply:

```jsx
<div
  class="Δdisplay Δbordered Δhoverable Δstack"
  style={{ padding: 0, background: 'transparent' }}
>
  {/* Background layer */}
  <div style={{ padding: 'var(--padding)' }}>
    <img ... />
  </div>

  {/* Banner with background + bottom corners only */}
  <div style={{
    backgroundColor: 'var(--background-color)',
    borderBottomLeftRadius: 'var(--border-bottom-left-radius)',
    borderBottomRightRadius: 'var(--border-bottom-right-radius)',
    padding: 'var(--padding)',
  }}>
    Content
  </div>
</div>
```

### Pseudo-element Wiring

```css
.my-element::after {
  padding: var(--padding);
  border-radius: var(--border-radius);
}
```

### Mixing with Regular CSS

Delta doesn't fight external CSS. Write what you need:

```jsx
<div
  class="Δaction Δfilled Δemphasis-accent"
  style={{
    minWidth: '200px',  // Delta doesn't compute this
    gridColumn: 'span 2',  // Layout concerns are yours
  }}
>
```

---

## Inheritance Control

Elements are **isolated by default** - they reset their context. To inherit:

| Class | Effect |
|-------|--------|
| `Δinherits` | Inherit all factors |
| `Δinherits-emphasis-factor` | Inherit just emphasis |
| `Δinherits-prominence-factor` | Inherit just prominence |
| `Δinherits-intent-factor` | Inherit just intent |
| `Δinherits-interactivity-factor` | Inherit interactivity states |

---

## Anti-Patterns

### DON'T: Add manual spacing/colors

```jsx
// BAD - fighting Delta
<div class="Δaction Δfilled" style={{ padding: '16px', backgroundColor: 'blue' }}>

// GOOD - adjust factors or route computed values
<div class="Δaction Δfilled Δdensity-large">
```

### DON'T: Write hover/focus CSS

```css
/* BAD - Delta handles this */
.my-button:hover {
  background-color: lightblue;
}

/* GOOD - add capability class */
<button class="Δaction Δhoverable Δfilled">
```

### DON'T: Create utility classes

```css
/* BAD - unnecessary overhead */
.align-left { text-align: left; }

/* GOOD - just write the CSS */
style={{ textAlign: 'left' }}
```

### DON'T: Override computed values, TUNE input factors

```jsx
// BAD - overriding output
style={{ borderRadius: '8px' }}

// GOOD - adjust density which affects border-radius computation
class="Δdensity-large"

// ALSO GOOD - route the computed value elsewhere
style={{ borderRadius: 'var(--border-radius)' }}  // on a child
```

---

## The Mathematical Foundation (Optional)

Delta uses:
- **Golden ratio (1.618)** for spatial relationships (gap, padding)
- **Major third (1.25)** for typographic scale
- **Inverse optical sizing** — `pow(0.8, factor)` for weight and tracking (larger = lighter/tighter, matching 500 years of punchcutting tradition)
- **4px grid** for all spatial snapping
- **OKLCH color space** for perceptual uniformity
- **Helmholtz-Kohlrausch compensation** for hue-dependent lightness adjustment
- **Irradiation compensation** — lighter base weights on dark surfaces to counter gamma spreading (Helmholtz 1867)

You don't need to understand this to use Delta. But if something "feels wrong", the math is telling you your semantic structure doesn't match coherent design patterns.

**For deep computation details:** Read the source files in `second-foundation/delta-css/src/`:
- `foundation.css` - constraint engine and color math
- `factors.css` - how factors combine
- `layouts.css` - spatial patterns
- `typography.css` - text system

This manual teaches usage. The source teaches computation.

---

## Quick Reference

**Declare an interactive button:**
```html
<button class="Δaction Δhoverable Δactivable Δfilled Δemphasis-accent">
```

**Declare a form input:**
```html
<input class="Δcontrol Δfocusable Δbordered">
```

**Declare a button group:**
```html
<div class="Δgroup">
  <button class="Δaction Δhoverable Δbordered">A</button>
  <button class="Δaction Δhoverable Δbordered">B</button>
</div>
```

**Declare a status badge:**
```html
<span class="Δdisplay Δfilled Δemphasis-success Δdensity-compact">
  Active
</span>
```

**Split properties (border on parent, background on child):**
```jsx
<div class="Δdisplay Δbordered" style={{ background: 'transparent' }}>
  <div style={{ backgroundColor: 'var(--background-color)' }}>
    Content
  </div>
</div>
```
