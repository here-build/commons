# Form Controls Visual Hierarchy

## Design Principle: Active vs. Disabled

The here.build design system uses a clear visual distinction between active and disabled form controls:

- **Filled = Active/Enabled** - The control is interactive and ready for user input
- **Outlined = Disabled** - The control is view-only and cannot be interacted with

This creates an immediate visual hierarchy where interactive elements have more visual weight, making it instantly clear what users can and cannot interact with.

## Application Scope

This visual hierarchy applies across all Here.build interfaces, but with a **tiered approach** based on element type:

### Tier 1: Form Controls (Universal Application)
Apply the filled/outlined distinction everywhere for:
- Text inputs
- Select dropdowns  
- Textareas
- Hybrid input+select controls
- Date/time pickers
- Any element where users input data

**Where this applies:**
- Studio interface (property panels, settings)
- User settings dashboard
- Project creation/edit forms
- Account management forms
- Any form-based UI

### Tier 2: Action Elements (Traditional Patterns)
Use traditional button patterns with opacity for disabled states:
- Primary buttons (filled)
- Secondary buttons (outlined)
- Ghost buttons (transparent)
- Icon buttons
- Links

**Disabled state:** Reduced opacity (0.5-0.6) rather than switching fill modes

### Tier 3: Content Elements (Surface + Opacity)
Use elevation and opacity for state management:
- Cards
- List items
- Grid items
- Navigation items
- Menu items

**Disabled state:** Reduced opacity + removed hover effects

## Rationale

The filled/outlined pattern specifically answers "Can I input data here?" which is:
- ✅ Relevant for forms across all interfaces
- ❌ Not relevant for buttons (which ask "Can I trigger this action?")
- ❌ Not relevant for content (which asks "Can I interact with this item?")

## Form Control Types

### Text Inputs
- **Active**: Filled background with subtle border
- **Disabled**: Outlined only, reduced opacity
- **Visual cue**: No additional icons

### Select Dropdowns
- **Active**: Filled background with subtle border
- **Disabled**: Outlined only, reduced opacity  
- **Visual cue**: Dropdown arrow on the right

### Hybrid Input+Select (e.g., font size with unit dropdown)
- **Active**: Filled background with subtle border
- **Disabled**: Outlined only, reduced opacity
- **Visual cue**: Visual separator + dropdown arrow

### Switches/Toggles
- **Active**: Filled track with contrasting thumb
- **Disabled**: Outlined appearance, reduced opacity
- **Visual cue**: Sliding thumb position

## Implementation in Delta System

```css
/* Active form controls use filled style */
.input:not(:disabled),
.selectTrigger:not(:disabled) {
  background-color: var(--surface-raised);
  border: 1px solid var(--border-color);
}

/* Disabled form controls use outlined style */
.input:disabled,
.selectTrigger:disabled {
  background-color: transparent;
  border: 1px solid var(--border-color);
  opacity: 0.6;
}
```

## Benefits

1. **Immediate Scanability**: Users can instantly see what's interactive
2. **Consistent Mental Model**: All disabled elements share the same visual treatment
3. **Reduced Cognitive Load**: No ambiguity between different types of disabled controls
4. **Visual Hierarchy**: Active elements naturally draw more attention

## Visual Indicators

Users differentiate between control types through secondary cues:
- **No icon** = Text input
- **Dropdown arrow** = Select  
- **Separator + arrow** = Hybrid input
- **Switch track** = Toggle

The primary distinction (active vs disabled) takes precedence over control type, as the ability to interact is more important than the specific interaction method.

## Implementation Examples

### Tier 1: Form Control (Settings Dashboard)
```css
/* Active email input in user settings */
.settingsInput:not(:disabled) {
  background-color: var(--surface-raised);
  border: 1px solid var(--border-color);
}

/* Disabled email input (OAuth users) */
.settingsInput:disabled {
  background-color: transparent;
  border: 1px solid var(--border-color);
  opacity: 0.6;
}
```

### Tier 2: Action Element (Project Actions)
```css
/* Delete button - always outlined, opacity for disabled */
.deleteButton {
  background-color: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
}

.deleteButton:disabled {
  opacity: 0.5; /* Don't change fill mode */
  cursor: not-allowed;
}
```

### Tier 3: Content Element (Project Card)
```css
/* Project card - uses surface elevation */
.projectCard {
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-sm);
}

/* Disabled project (no permissions) */
.projectCard.disabled {
  opacity: 0.6;
  pointer-events: none;
}
```

## Key Principle

Form controls use the filled/outlined distinction because they're about **data input**.
Other UI elements maintain their established patterns because they serve different purposes:
- Buttons trigger **actions**
- Cards display **content**
- Navigation provides **wayfinding**

Each element type has its own optimal way to communicate disabled states.
