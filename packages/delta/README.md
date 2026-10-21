# Delta Design System

A **Design Grammar** - the missing rules for how design tokens combine into valid UI elements. ~600 lines of CSS that
encode the implicit rules designers use but rarely document.

## What Delta Is

Not a component library. Not a CSS framework. Delta is the **grammar layer** that sits between:

- **Vocabulary** (Design tokens: colors, spacing)
- **Sentences** (UI components: buttons, forms)

Just as natural language needs grammar to turn words into meaningful sentences, design systems need grammar to turn
tokens into consistent UI.

## Core Architecture

Delta is organized into CSS layers with explicit cascade order (see `index.css`):

1. **delta.configuration** (`foundation.css`) — mathematical constraint engine and computed variables
2. **delta.configuration-tweaks** (in `foundation.css`) — global, boundary-penetrating adjustments (e.g., dimming)
3. **delta.factors** (`factors.css`) — semantic factors (emphasis, density, scale, affinity, presence, prominence)
4. **delta.application** (`application.css`) — applies computed variables to visual properties
5. **delta.typography** (`typography.css`) — text system (roles, hierarchy, reciprocal sizing)
6. **delta.layouts** (`layouts.css`) — spatial patterns (layout, group, grid, stack, tabular)

Supporting files:

- `properties-outputs.css` — public @property declarations for type safety
- `*properties.css` — typed configuration property declarations split by concern

The system pre-computes all relationships using:

- OKLCH perceptual color space
- Golden ratio (1.618) for spatial relationships
- Major third (1.25) for typographic scale
- 4px grid for pixel-perfect alignment

## Usage

```html

<button class="Δhoverable Δfilled Δaction Δemphasis-accent">Click me</button>
```

## Interface Description Language

Delta classes read like English sentences that describe interface intent or s-expressions:

- **"Δhoverable Δfilled Δaction"** = "hoverable filled action element or (action :hoverable :filled)"
- **"Δgroup"** = "(:group)"
- **"Δdisplay Δemphasis-error"** = "error emphasis display or (:display emphasis: error)"

Adjectives modify nouns, behaviors are capabilities, scope boundaries provide isolation.

## Philosophy

1. **Declare semantic intent** - Use entity classes (Δaction, Δcontrol, Δgroup, Δdisplay)
2. **Add behavioral capabilities** - Use Δhoverable, Δfocusable, Δactivable for interactions
3. **Interface description language** - Classes read like English sentences
4. **Constraint mathematics over manual styling** - Let the system compute relationships
5. **Use modern CSS features** - OKLCH color space, CSS layers, @property, calc()
6. **Everything is a relationship** - Colors, spacing, and sizing flow from mathematical constraints

## Public API

Delta provides public API with 3 main means:

- "scope" classes that are declaring what DOM node is representing (can be combined - e.g. element+layout)
- "modifier" classes that are adjusting the behavior (can only be applied to matching entity)
- CSS variables (that can be both read and written - some of them are participating in further calculation)

### Scope classes

**.Δsurface-[canvas|base|raised]** defines the lightness elevation:

- canvas: 0.04 lightness (darkest)
- base: 0.18 lightness (default)
- raised: 0.24 lightness (elevated)

**.Δoverlay** is special surface for elements being on top of everything else, such as modals, tooltips, menus

Layouts:

**Semantic Entities:**

- **.Δaction** - Triggers behavior (buttons, links, clickable elements)
- **.Δcontrol** - Manipulates values (inputs, sliders, toggles, form controls)
- **.Δgroup** - Contains and organizes similar entities (button groups, toolbars)
- **.Δdisplay** - Shows information (badges, status indicators, labels, text)

**Behavioral Capabilities:**

- **.Δhoverable** - Can be hovered (adds interactive feedback)
- **.Δfocusable** - Can receive focus (keyboard navigation)
- **.Δactivable** - Can be pressed/activated (touch/click states)

**Layouts:**

- **.Δlayout** is flex layout for mixed content. Horizontal by default, **.Δlayout.Δvertical** for vertical.
- **.Δgroup** contains similar semantic entities. Supports **.Δvertical**

### Aspect classes

**Visual Attributes:**

- **Emphasis**: neutral (default), accent, success, error, danger, info, variant, data
- **Visual style**: filled, bordered
- **Density**: compact, small, default, large, spacious — affects spacing and font size together
- **Scale**: xs, small, default, large, xl — affects font size only (orthogonal to density)
- **Prominence**: ambient, default, strong — tunes lightness/chroma/text contrast
- **Presence**: subtle, regular, strong, bold — adjusts perceived visual strength
- **Shape**: square, square-large, pill — affects padding ratios and corner radius
- **Affinity**: intimate, affine, default, unrelated — affects inner proximity only (not outer spacing)

### Typography

**.Δtext** with roles:

- **.Δrole-display**, **.Δhierarchy-[1-4]** - headings
- **.Δrole-body** - long-form text
- **.Δrole-ui** - interface text
- **.Δrole-label**, **.Δrole-caption** - supporting text
- **.Δrole-code** - monospace text
- **.Δrole-shortcut**, **.Δrole-chip** - special UI text

Notes:

- `Δtext` is inline by default and cooperates with `Δlayout`/`Δgroup`
- Headings use petite caps and heading font, body/UI use sans

### Variables flow

Delta uses a three-tier variable system:

- **--⚙️** (Configuration): Global constants that define the system
- **--🎛** (Tuning): Intermediate computations, redeclared at usage level
- **--🔧** (Scoped): Cascade adjustments within specific contexts

All variables that are intended to be explicitly mapped to certain property have matching variable name.
All variables that have varying behavior follows `--<type>-<meaning>` convention.
`-interactive` is same color the original one is, but reacting to proper interactive features support
`-transparent-interactive` is transparent color that interactively reacts similar to -interactive behavior, mimicking
lightness change with opacity change

Color aspects (computed by the system):

- --lightness-neutral
- --lightness-emphasis
- --chroma-emphasis
- --lightness-emphasis-text
- --chroma-emphasis-text

Colors:

- --color-text-primary (0.96 lightness)
- --color-text-secondary (0.7 lightness)
- --color-text-tertiary (0.5 lightness)
- --color-text-disabled
- --color-neutral(-interactive|-transparent-interactive)
- --color-neutral-text(-interactive)
- --color-emphasis(-interactive|-transparent-interactive)
- --color-emphasis-text(-interactive)
- --background-color-surface (computed from surface elevation)
- --background-color (element background)
- --border-color (element border)
- --text-color (element text)

Spacing:

- --gap-x, --gap-y (also --gap as shorthand) - computed from golden ratio
- --padding-top, --padding-right, --padding-bottom, --padding-left (also --padding as shorthand)
- --padding-top-borderless, --padding-right-borderless, --padding-bottom-borderless, --padding-left-borderless (padding
  without border compensation)
- --border-top-width, --border-right-width, --border-bottom-width, --border-left-width (also --border-width as
  shorthand)
- --border-radius (computed from padding)
- --icon-size (matches line-height for perfect alignment)
- --chrome-size (48px default - for UI framework elements like toolbars)
- --box-shadow (computed with lightness offsets)

Text:

- --font-size
- --line-height
- --letter-spacing
- --font-weight
- --font-sans, --font-heading, --font-mono (font stacks)

State indicators (0 or 1 values for inline calculations):

- --active (1 when Δactivable element is active)
- --checked (1 when Δcontrol element is checked)
- --hovered (1 when Δhoverable element is hovered)
- --focused (1 when Δfocusable element has focus-visible)

### Additional behaviors

- **Δdelegating**: when applied to an entity, padding is applied to its children to enable content-aware spacing
- **Δdimmable / Δdimmer**: opt-in system-wide dimming that preserves interaction feedback (see
  `delta.configuration-tweaks`)
