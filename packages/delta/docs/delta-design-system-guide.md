---
title: delta design system guide
genre: reference
status: current
tags: [delta, css, design-science, reference]
created: 2025-06-06
updated: 2026-04-27
---

# Delta Design System Guide

This is the canonical overview of the Delta design system used in this repository. Delta is a design grammar: a thin, semantic layer that mathematically composes design tokens into coherent UI.

## Layers and Files

- `second-foundation/delta-css/src/index.css` — entry point that imports layers and sets their order
- `second-foundation/delta-css/src/foundation.css` — delta.configuration (+ configuration-tweaks) with computed variables
- `second-foundation/delta-css/src/factors.css` — delta.factors (emphasis, density, scale, affinity, presence, prominence)
- `second-foundation/delta-css/src/application.css` — delta.application (applies computed variables)
- `second-foundation/delta-css/src/layouts.css` — delta.layouts (layout, group, grid, stack, tabular)
- `second-foundation/delta-css/src/typography.css` — delta.typography (roles, hierarchy, sizing)
- `second-foundation/delta-css/src/properties-outputs.css` — public @property declarations for type safety

## Core Concepts

- Semantic entities: `Δaction`, `Δcontrol`, `Δgroup`, `Δdisplay`
- Behavioral capabilities: `Δhoverable`, `Δfocusable`, `Δactivable`
- Visual style: `Δfilled`, `Δbordered`
- Factors: emphasis, density, scale, prominence, presence, affinity, shape
- Surfaces: `Δsurface-[canvas|base|raised]`, `Δoverlay`
- Delegation: `Δdelegating` shifts padding to children for content-aware spacing
- Dimming: `Δdimmer` + `Δdimmable` provide unobtrusive, boundary-penetrating dim states

## Usage Basics

```html
<button class="Δaction Δfilled Δemphasis-accent Δhoverable">Click</button>

<div class="Δgroup">
  <button class="Δaction Δbordered Δhoverable">Left</button>
  <button class="Δaction Δbordered Δhoverable">Right</button>
  </div>

<div class="Δlayout Δvertical">
  <span class="Δdisplay">Label</span>
  <input class="Δcontrol Δbordered Δfocusable" />
</div>
```

## Typography

Use `Δtext` with roles and hierarchy:
- Roles: `Δrole-display`, `Δrole-body`, `Δrole-ui`, `Δrole-label`, `Δrole-caption`, `Δrole-code`, `Δrole-shortcut`, `Δrole-chip`
- Hierarchy: `Δhierarchy-1` … `Δhierarchy-4`
- Importance: `Δimportance-high`, `Δimportance-normal`, `Δimportance-low`

## References

- **Implementation details**: `second-foundation/delta-css/README.md` — Complete API reference and implementation notes
- **AI guide**: `docs/delta-manual-for-claude.md` — Comprehensive guide optimized for AI assistants
