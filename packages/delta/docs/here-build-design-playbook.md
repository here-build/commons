# The here.build Design Playbook

## Design philosophy that actually works in 2025

The design world just experienced its biggest reality check with Apple's "liquid ass" debacle - when Vision Pro's translucent design language hit iOS 26, users revolted. The lesson? Stop chasing trends that sacrifice usability for aesthetics. This playbook builds on what's proven to work: speed, clarity, and tools that feel like they were made by developers for developers.

here.build isn't another enterprise visual builder. It's a professional tool for you and your friends building together - combining designer efficiency with developer sensibility. Think Linear's speed, Figma's collaboration, and Raycast's keyboard-first power, wrapped in a visual builder that doesn't feel like it's fighting you.

## Part 1: Core Design Grammar

### The Three-State Foundation

Every interface element in here.build follows a three-state emphasis pattern that users intuitively understand:

**Filled State** - High emphasis, primary actions
- Reserved for the single most important action per view
- Uses vibrant brand colors at full saturation
- Clear boundaries with subtle depth (2-4dp shadow)
- Example: "Publish" button, primary CTAs

**Outlined State** - Medium emphasis, secondary actions  
- Alternative actions and navigation elements
- 2px borders using slightly darker than surface
- No fill, allowing content behind to show through
- Example: "Save Draft", secondary navigation

**Ghost State** - Low emphasis, tertiary actions
- Dismissive actions and overflow menus
- No borders, subtle hover states only
- Text uses reduced lightness for recessive presence
- Example: "Cancel", keyboard shortcuts hints

### Building Blocks, Not Just Components

Instead of a rigid component library, here.build uses a grammar system where elements combine predictably:

**Shadow Grammar with OKLCH**
```css
/* Shadows using darker colors, not transparent black */
.shadow-sm {
  box-shadow: 
    0 1px 2px -1px oklch(0.1 0 0),    /* Near black */
    0 1px 3px 0 oklch(0.15 0 0);      /* Slightly lighter */
}

.shadow-md {
  box-shadow: 
    0 4px 6px -2px oklch(0.08 0 0),   /* Darker for more depth */
    0 2px 4px -1px oklch(0.12 0 0);
}

.shadow-lg {
  box-shadow: 
    0 10px 15px -3px oklch(0.05 0 0), /* Very dark */
    0 4px 6px -2px oklch(0.1 0 0);
}

/* Colored shadows that match the element */
.shadow-glow {
  box-shadow: 
    0 0 20px oklch(from var(--brand) calc(l * 0.5) c h),
    0 0 40px oklch(from var(--brand) calc(l * 0.3) c h);
}

/* Adaptive shadows based on surface */
.adaptive-shadow {
  box-shadow: 
    0 4px 6px -2px oklch(from var(--surface) calc(l - 0.5) c h),
    0 2px 4px -1px oklch(from var(--surface) calc(l - 0.3) c h);
}
```

Each layer uses consistent shadow values that create natural depth. No more `rgba(0,0,0,0.1)` - just pure color math!

**State Transitions**
- Default → Hover: 200ms ease-out, subtle shadow elevation
- Hover → Active: 50ms linear, immediate feedback
- Active → Default: 150ms ease-in-out, gentle return
- Loading states: 500ms minimum to prevent flashing

## Part 2: Color System with OKLCH

### The "No Opacity" Principle

OKLCH eliminates the need for opacity in UI design. Everything traditionally done with opacity can be achieved through lightness and chroma manipulation:

**Traditional Problems with Opacity:**
- Reduces text readability when applied to containers
- Creates CSS stacking context complications  
- Forces browser compositing (performance hit)
- Unpredictable results with overlapping elements
- Accessibility issues with contrast

**OKLCH Solutions:**
```css
/* Instead of opacity: 0.6 for secondary text */
.text-secondary {
  color: oklch(from var(--text) calc(l + 0.2) c h);
}

/* Instead of opacity: 0.5 for disabled */
.disabled {
  color: oklch(from var(--text) calc(l + 0.3) calc(c * 0.3) h);
}

/* Instead of white overlay with opacity: 0.1 */
.hover-highlight {
  background: oklch(from var(--surface) calc(l + 0.05) c h);
}

/* Instead of black overlay with opacity: 0.8 */
.modal-backdrop {
  background: oklch(0.1 0 0); /* Just use dark color */
}
```

The only valid use of opacity in here.build: actual transparency needs (like fade-in/out animations).

### Perceptually Uniform Colors

here.build uses OKLCH color space for predictable, human-perception-aligned color manipulation:

**Foundation Colors in OKLCH**
```css
/* Base colors defined in OKLCH */
--orange: oklch(0.7 0.2 50);    /* Vibrant orange */
--lime: oklch(0.85 0.3 130);    /* Electric lime */
--gray: oklch(0.3 0.01 240);    /* Cool gray */

/* Surface elevation through lightness */
--surface-0: oklch(0.15 0.01 240);  /* Background */
--surface-1: oklch(0.2 0.01 240);   /* Cards */
--surface-2: oklch(0.25 0.01 240);  /* Elevated */
--surface-3: oklch(0.3 0.01 240);   /* Modals */
```

**Relative Color Magic**

OKLCH enables mathematical relationships between colors:

```css
/* Buttons that are always +10% lighter than their surface */
.button-primary {
  --surface-l: 0.2; /* Current surface lightness */
  background: oklch(calc(var(--surface-l) + 0.1) 0.01 240);
}

/* Hover states with perceptual consistency */
.button:hover {
  background: oklch(from var(--button-bg) calc(l + 0.05) c h);
}

/* Focus rings that adapt to any background */
.input:focus {
  outline: 2px solid oklch(from var(--surface) calc(l + 0.3) 0.1 h);
}
```

### Dynamic Elevation System

Instead of fixed colors, elevate through lightness:

```css
/* Each elevation step adds 5% lightness */
.elevation-0 { background: oklch(0.15 0.01 240); }
.elevation-1 { background: oklch(0.20 0.01 240); }
.elevation-2 { background: oklch(0.25 0.01 240); }
.elevation-3 { background: oklch(0.30 0.01 240); }

/* Components automatically adapt */
.card {
  background: var(--surface-1);
  
  .card-header {
    /* Header is always slightly lighter than body */
    background: oklch(from var(--surface-1) calc(l + 0.03) c h);
  }
}
```

### Semantic Color Relationships

```css
/* Success/Error/Warning derived from base hue */
--success: oklch(0.75 0.2 145);  /* Green */
--error: oklch(0.65 0.25 25);    /* Red-orange */
--warning: oklch(0.8 0.2 85);     /* Yellow */

/* Disabled states reduce chroma, not opacity */
.disabled {
  color: oklch(from var(--text) l 0.05 h);
}

/* Border colors are always -10% lightness */
.bordered {
  border: 1px solid oklch(from var(--surface) calc(l - 0.1) c h);
}
```

### Advanced OKLCH Techniques

**Perceptual Contrast Guarantees**
```css
/* Text that's always readable on any surface */
.adaptive-text {
  --bg-lightness: /* from parent */;
  color: oklch(
    calc(var(--bg-lightness) > 0.5 ? 0.15 : 0.9) 
    0.01 
    240
  );
}
```

**Chroma Boost for Emphasis**
```css
/* Saturate on interaction */
.interactive:hover {
  background: oklch(from var(--surface) l calc(c + 0.1) h);
}

/* Desaturate for background elements */
.receded {
  color: oklch(from var(--text) l calc(c * 0.3) h);
}
```

**Hue Rotation for Variants**
```css
/* Generate complementary colors */
.variant-1 { background: oklch(0.7 0.2 50); }        /* Base */
.variant-2 { background: oklch(0.7 0.2 170); }       /* +120° */
.variant-3 { background: oklch(0.7 0.2 290); }       /* +240° */
```

## Part 3: Typography with System Fonts

### Native Performance, Zero Downloads

**System Font Stack**
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", 
               system-ui, "Helvetica Neue", Arial, sans-serif;
```

Why system font:
- Instant loading (already on device)
- Native feeling on each platform
- Optimized for screen rendering
- User familiarity = less cognitive load

```css
--font-mono: "Martian Mono", ui-monospace, "SF Mono", "Cascadia Code", 
             "Roboto Mono", Menlo, Monaco, Consolas, monospace;
```

We can be more relaxed on monotype font, as it is not used anywhere on first render - it's mostly in popups and dialogs.

**Typography Scale with Relative Sizing**
```css
:root {
  --text-base: 1rem;  /* 16px */
  --scale-ratio: 1.25; /* Major third */
}

/* Scale using calc() for precise control */
--text-xs: calc(var(--text-base) / var(--scale-ratio));      /* 12.8px */
--text-sm: calc(var(--text-base) / 1.125);                   /* 14.2px */
--text-md: var(--text-base);                                 /* 16px */
--text-lg: calc(var(--text-base) * var(--scale-ratio));      /* 20px */
--text-xl: calc(var(--text-base) * pow(var(--scale-ratio), 2)); /* 25px */
--text-2xl: calc(var(--text-base) * pow(var(--scale-ratio), 3)); /* 31.25px */
```

**Platform-Specific Optimizations**
```css
/* macOS: Tighter tracking, lighter weights */
@supports (font: -apple-system-body) {
  body {
    letter-spacing: -0.015em;
    font-weight: 400;
  }
}

/* Windows: Slightly heavier for ClearType */
@media screen and (-ms-high-contrast: none) {
  body {
    font-weight: 450;
  }
}
```

## Part 4: Motion and Interaction

### Functional Animation Only

Every animation in here.build serves a purpose:

**Micro-interactions** (100-200ms)
- Button feedback
- Checkbox toggles
- Input focus

**Transitions** (200-300ms)
- Panel slides
- View changes
- State updates

**No Animation Zone**
- Continuous decorative motion
- Parallax effects
- Bouncy/elastic easings
- Anything over 500ms without user initiation

### Keyboard-First Design

Taking cues from Raycast and Linear:
- ⌘K opens command palette from anywhere
- Tab navigation through all UI elements
- Vim-style shortcuts for power users
- Visual hints for available shortcuts

## Part 5: Component Patterns

### Cards That Work

```
Structure:
┌─────────────────────────┐
│ [Icon] Title      [...] │ <- Header zone
├─────────────────────────┤
│                         │
│     Main content        │ <- Content zone
│                         │
├─────────────────────────┤
│ [Action] [Secondary]    │ <- Action zone
└─────────────────────────┘
```

- 8px border radius (not trying to be iOS)
- 1px borders in light mode, borderless in dark
- Hover: Elevate 2px with shadow
- Active: Depress 1px with reduced shadow

### Data Tables for Builders

- Sticky headers that actually work
- Row hover highlights without being distracting
- Inline editing with clear affordances
- Bulk actions appear on selection
- Responsive collapse to cards on mobile

### Forms That Don't Frustrate

- Labels above inputs (always)
- Real-time validation with helpful messages
- Error states that suggest fixes
- Progress indicators for multi-step forms
- Smart defaults based on context

## Part 6: Spatial Design Without the Gimmicks

### Depth That Makes Sense

Layer hierarchy:
1. **Canvas** - The infinite workspace
2. **Panels** - Docked tools and properties
3. **Content** - Your actual work
4. **Overlays** - Contextual menus and tooltips
5. **Modals** - Focus-stealing only when necessary

No fake 3D, no glassmorphism, no "liquid" anything. Just clear visual hierarchy through subtle shadows and proper layering.

### OKLCH Relative Color Cookbook

**Interactive State Cascade**
```css
/* Base interactive element */
.interactive {
  --base-l: 0.25;
  background: oklch(var(--base-l) 0.02 240);
  
  /* Each state adds predictable lightness */
  &:hover {
    background: oklch(calc(var(--base-l) + 0.05) 0.02 240);
  }
  
  &:active {
    background: oklch(calc(var(--base-l) - 0.02) 0.02 240);
  }
  
  &:focus-visible {
    outline: 2px solid oklch(calc(var(--base-l) + 0.4) 0.15 var(--brand-hue));
  }
}
```

**Contextual Color Relationships**
```css
/* Colors that know their surroundings */
.adaptive-element {
  /* Grab parent's background lightness */
  --parent-l: var(--surface-l, 0.2);
  
  /* Always 15% lighter than parent */
  background: oklch(calc(var(--parent-l) + 0.15) 0.01 240);
  
  /* Border is always darker than background */
  border: 1px solid oklch(calc(var(--parent-l) + 0.05) 0.01 240);
  
  /* Text contrast flips at 50% lightness */
  color: oklch(
    calc(var(--parent-l) > 0.5 ? 0.15 : 0.95) 
    0 0
  );
}
```

**Status Colors from Single Hue**
```css
/* Generate entire status palette from brand color */
:root {
  --brand-hue: 50; /* Orange */
  
  /* Status colors via hue rotation */
  --success: oklch(0.75 0.2 calc(var(--brand-hue) + 95));  /* Green */
  --warning: oklch(0.8 0.2 calc(var(--brand-hue) + 35));   /* Yellow */
  --error: oklch(0.65 0.25 calc(var(--brand-hue) - 25));   /* Red */
  --info: oklch(0.7 0.15 calc(var(--brand-hue) + 180));    /* Blue */
}

/* Muted versions reduce chroma */
.status-muted {
  background: oklch(from var(--success) l calc(c * 0.3) h);
}
```

**Depth Through Chroma**
```css
/* Closer elements have higher chroma */
.layer-0 { background: oklch(0.2 0.005 240); }  /* Far */
.layer-1 { background: oklch(0.25 0.01 240); }  /* Medium */
.layer-2 { background: oklch(0.3 0.015 240); }  /* Near */
.layer-3 { background: oklch(0.35 0.02 240); }  /* Closest */

/* Interactive elements boost chroma on hover */
.card:hover {
  transform: translateY(-2px);
  background: oklch(from var(--surface) l calc(c + 0.01) h);
}
```

**Temperature Shifts for Mode**
```css
/* Warm/cool modes via hue adjustment */
.warm-mode {
  --surface: oklch(0.95 0.01 60);  /* Warm gray */
  --text: oklch(0.2 0.01 30);      /* Warm black */
}

.cool-mode {
  --surface: oklch(0.95 0.01 240); /* Cool gray */
  --text: oklch(0.2 0.01 240);     /* Cool black */
}

/* Auto-adjust accent colors to match */
.accent {
  background: oklch(
    from var(--brand) 
    l c 
    calc(h + (var(--mode-hue-shift, 0)))
  );
}
```

**Smart Gradients**
```css
/* Perceptually smooth gradients */
.gradient-surface {
  background: linear-gradient(
    to bottom,
    oklch(0.15 0.01 240),
    /* OKLCH interpolates better than RGB */
    oklch(0.25 0.01 240)
  );
}

/* Vibrant gradient with consistent perceived brightness */
.gradient-vibrant {
  background: linear-gradient(
    135deg,
    oklch(0.7 0.25 30),   /* Orange */
    oklch(0.7 0.25 130)   /* Green - same L! */
  );
}
```

### OKLCH Replaces Opacity Everywhere

**No More Opacity for Color Blending!** OKLCH lets us achieve the same visual effects through direct color manipulation:

**Traditional Opacity Approach (Bad)**
```css
/* This affects text readability and creates stacking contexts */
.disabled {
  opacity: 0.5;
}

.secondary-text {
  color: rgb(0, 0, 0);
  opacity: 0.6;
}

.hover-overlay {
  background: white;
  opacity: 0.1;
}
```

**OKLCH Approach (Good)**
```css
/* Disabled: Reduce both lightness and chroma */
.disabled {
  color: oklch(from var(--text) calc(l - 0.2) calc(c * 0.3) h);
  background: oklch(from var(--surface) l calc(c * 0.3) h);
}

/* Secondary text: Adjust lightness based on background */
.secondary-text {
  color: oklch(from var(--text) calc(l - 0.15) c h);
}

/* Hover overlay: Mix colors instead of layering */
.hover-overlay {
  background: oklch(from var(--surface) calc(l + 0.05) c h);
}
```

**Why This Matters:**
1. **Performance**: No compositor overhead from opacity layers
2. **Clarity**: Text remains sharp, not semi-transparent
3. **Control**: Exact color relationships, not guessing with percentages
4. **Accessibility**: Better contrast control for readability

**Common Patterns Reimagined:**
```css
/* Loading skeleton - no opacity animation */
@keyframes skeleton-pulse {
  0%, 100% { 
    background: oklch(0.9 0.01 240);
  }
  50% { 
    background: oklch(0.95 0.01 240);
  }
}

/* Disabled states - reduce chroma, adjust lightness */
input:disabled {
  background: oklch(from var(--input-bg) calc(l + 0.1) calc(c * 0.2) h);
  color: oklch(from var(--text) calc(l - 0.1) calc(c * 0.5) h);
}

/* Focus rings - no semi-transparent overlays */
.focus-ring {
  box-shadow: 0 0 0 3px oklch(from var(--brand) l calc(c * 0.5) h);
}

/* Backdrop overlays - darken via lightness */
.modal-backdrop {
  background: oklch(0.1 0 0);  /* Near black, no opacity */
}
```

**Loading State Animations**
```css
/* Pulse using lightness instead of opacity */
@keyframes pulse-light {
  0%, 100% { 
    background: oklch(from var(--surface) l c h);
  }
  50% { 
    background: oklch(from var(--surface) calc(l + 0.1) c h);
  }
}

.loading {
  animation: pulse-light 2s ease-in-out infinite;
}
```

## Part 7: Building Blocks in Practice

### The Component Decision Tree

When adding new components, ask:
1. Does it solve a real user problem?
2. Can it be built from existing grammar?
3. Will it work across all themes/modes?
4. Is it accessible by default?
5. Does it feel native to the platform?

If any answer is no, iterate or reconsider.

### Pattern Examples

**Empty States**
- Illustration using brand colors
- Clear explanation of what's missing
- Single primary action to fix it
- No patronizing messages

**Loading States**
- Skeleton screens that match final layout
- Progress indicators for known durations
- Subtle animations that don't distract
- Always interruptible

**Error Handling**
- Human-readable messages
- Actionable next steps
- Recovery options when possible
- Technical details on demand

## Part 8: Accessibility as Foundation

### Built-In, Not Bolted On

Every component ships with:
- Keyboard navigation
- Screen reader labels
- Focus indicators that work in all themes
- Touch targets minimum 44px
- Color-blind safe palettes

### Testing Requirements

Before any component ships:
- [ ] Axe DevTools passes
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces correctly
- [ ] Works with 200% zoom
- [ ] Reduced motion respected

## Part 9: Implementation Guidelines

### Design Token Structure

```javascript
// tokens/color.js
export const colors = {
  // OKLCH primitives
  primitive: {
    orange: 'oklch(0.7 0.2 50)',
    lime: 'oklch(0.85 0.3 130)',
    gray: 'oklch(0.3 0.01 240)'
  },
  // Semantic tokens use CSS variables for runtime calculation
  semantic: {
    primary: 'var(--orange)',
    accent: 'var(--lime)',
    surface: 'var(--gray)',
    // Borders are calculated from surface
    border: 'oklch(from var(--surface) calc(l - 0.1) c h)',
    borderHover: 'oklch(from var(--surface) calc(l - 0.15) c h)'
  }
}

// Text hierarchy through lightness
const textColors = {
  primary: 'oklch(0.15 0.01 240)',      // Full contrast
  secondary: 'oklch(0.35 0.01 240)',    // 80% → -20% lightness  
  tertiary: 'oklch(0.5 0.01 240)',      // 60% → -35% lightness
  disabled: 'oklch(0.6 0.005 240)',     // 40% → -45% lightness + reduced chroma
}
```

### OKLCH Browser Support & Fallbacks

```css
/* Progressive enhancement approach */
.button {
  /* Fallback for older browsers */
  background: rgb(251, 133, 0);
  
  /* OKLCH for modern browsers */
  background: oklch(0.7 0.2 50);
  
  /* P3 enhancement for wide-gamut displays */
  @media (color-gamut: p3) {
    background: oklch(0.7 0.3 50); /* Boost chroma on P3 */
  }
}

/* Feature detection */
@supports (background: oklch(0 0 0)) {
  /* OKLCH-specific features */
  .dynamic-surface {
    background: oklch(from var(--surface) calc(l + 0.1) c h);
  }
}
```

### Component Architecture

```jsx
// Composable, not configurable
<Button variant="primary" size="md">
  Publish
</Button>

// Not this mess:
<Button 
  color="orange"
  borderWidth={2}
  shadowDepth={4}
  hoverEffect="lift"
  ... // 20 more props
>
```

### Performance Targets

- First paint: < 1 second
- Interactive: < 2 seconds  
- Animations: Consistent 60fps
- Bundle size: < 200kb for core

## Part 10: The Anti-Patterns to Avoid

### What We're NOT Building

**No Enterprise Feeling**
- No dense dashboards
- No feature creep
- No "manager mode"
- No reporting for reporting's sake

**No Tech Bro Aesthetics**  
- No dark patterns
- No growth hacking UI
- No engagement traps
- No notification spam

**No Trend Chasing**
- No glassmorphism
- No excessive animations
- No AI for AI's sake
- No features because competitors have them

## Conclusion: Tools for Builders, By Builders

here.build succeeds when users feel like they're working with a tool made by people who understand their workflow. Every decision - from the keyboard shortcuts to the color palette - reinforces that this is a professional tool that doesn't take itself too seriously.

The best design system isn't the one with the most components or the trendiest animations. It's the one that gets out of the way and lets people build. That's what this playbook delivers: opinionated defaults, powerful primitives, and the flexibility to create without fighting your tools.

Ship fast. Build together. Make it feel like home.

---

### Quick OKLCH Reference

**OKLCH** = **O**K **L**ightness **C**hroma **H**ue
- **L**: 0 (black) to 1 (white) - perceptually uniform
- **C**: 0 (gray) to ~0.4 (maximum chroma) - saturation
- **H**: 0-360 degrees - hue angle

**Why OKLCH over HSL/RGB:**
- Uniform lightness perception (50% in OKLCH looks equally bright across all hues)
- Predictable color mixing
- Better gradients (no muddy middle colors)
- Mathematical relationships that match human perception

**Browser Support (2025):**
- Chrome 111+ ✓
- Safari 15.4+ ✓
- Firefox 113+ ✓
- Edge 111+ ✓

Fall back to sRGB hex colors for older browsers, but build with OKLCH as the foundation.
