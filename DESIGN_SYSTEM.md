---
name: PICKLERS OFFICIAL
description: A premium pickleball community and booking platform.
colors:
  accent-primary: "#00D98B"
  accent-primary-hover: "#00C47E"
  accent-secondary: "#3B82F6"
  accent-danger: "#F04848"
  accent-warning: "#FFBA3B"
  surface-base: "#0A1628"
  surface-raised: "#111F3A"
  surface-overlay: "#162849"
  surface-interactive: "#1C3258"
  ink-primary: "#E8ECF0"
  ink-secondary: "#8B99A8"
  ink-muted: "#556270"
  ink-inverse: "#0A1628"
  border-subtle: "rgba(139, 153, 168, 0.08)"
  border-default: "rgba(139, 153, 168, 0.15)"
  border-emphasis: "rgba(0, 217, 139, 0.28)"
typography:
  display:
    fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
  body:
    fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary-hover}"
---

# Design System: PICKLERS OFFICIAL

## 1. Overview

**Creative North Star: "The Premium Pickleball Hub"**

The PICKLERS design system balances high-end, "Apple-tier" software craftsmanship with the dynamic, active nature of pickleball. It leverages a rich, deep dark mode (or crisp light mode) punctuated by vibrant semantic accents, most notably a crisp, athletic emerald green (`#00D98B`). The layout is structured and professional for facility owners while feeling completely fluid and snappy for players. It explicitly rejects flat, generic SaaS templates and heavily relies on subtle glow shadows, backdrop blurs, and polished micro-animations to communicate premium quality.

**Key Characteristics:**
- **Athletic Elegance**: Crisp, high-contrast typography and vivid accents against deep, immersive surfaces.
- **Dimensionality**: Strategic use of layered shadows and glow effects (`shadow-glow`) to elevate interactive elements.
- **Snappy Interactivity**: Purposeful micro-animations (e.g., button shines, bouncy modal reveals) rather than sluggish choreography.

## 2. Colors

The palette uses a deeply saturated navy/slate foundation to make the athletic emerald accent pop with maximum contrast and vitality.

### Primary
- **Athletic Emerald** (#00D98B): The core brand accent. Used for primary actions, success states, and the signature "glow" shadow.
- **Emerald Hover** (#00C47E): The active/hover state for primary actions.

### Secondary
- **Action Blue** (#3B82F6): Used for secondary actionable items or informational highlights.

### Neutral
- **Deep Slate Base** (#0A1628): The absolute background in dark mode.
- **Raised Surface** (#111F3A): Used for cards and primary containers.
- **Overlay Surface** (#162849): Used for floating elements (popovers, dropdowns, modals).
- **Interactive Surface** (#1C3258): Used for hovered rows, secondary buttons, and input backgrounds.
- **Crisp Ink** (#E8ECF0): Primary body text.

### Named Rules
**The Emerald Restraint Rule.** The primary accent (`#00D98B`) is powerful. Use it exclusively for primary actions, active selections, and success confirmations. Do not use it for decorative borders or ambient backgrounds unless specifically requested by a premium component.

## 3. Typography

**Display Font:** "Inter", "SF Pro Display"
**Body Font:** "Inter", "SF Pro Text"

**Character:** A highly functional, native-feeling, and crisp geometric sans-serif stack that prioritizes legibility and a modern, high-tech aesthetic. It relies on subtle negative letter-spacing for headings to feel tight and designed.

### Hierarchy
- **Display** (700, 1.75rem, 1.2): Page titles, major hero numbers.
- **Headline** (600, 1.25rem, 1.3): Section headers, modal titles.
- **Title** (600, 1rem, 1.4): Card titles, prominent list items.
- **Body** (400, 16px, 1.6): Standard reading text and descriptions. Max width ~75ch for prose.
- **Label** (500, 0.875rem, normal): Button text, input labels, metadata.

### Named Rules
**The Tight Heading Rule.** Headings (Display and Headline) must use negative letter-spacing (`-0.015em` to `-0.01em`) to feel engineered and locked-in, never loose.

## 4. Elevation

The system uses a deliberate, layered shadow vocabulary. While surfaces are generally flat at rest, interactive or floating elements use distinct shadow depths, often combined with `backdrop-blur-2xl`.

### Shadow Vocabulary
- **Subtle Lift** (`shadow-sm`): Subtle borders and minimal separation for resting interactive elements.
- **Card Depth** (`shadow-md`): Standard floating cards and dropdowns.
- **Modal Float** (`shadow-lg`): Large, screen-centering floating elements (Dialogs).
- **Emerald Glow** (`shadow-glow`): A 24px soft emerald glow used to elevate highly active or "premium" primary actions.

### Named Rules
**The Floating Pill Rule.** Success and error messages (Toasts, Inline Alerts) must feel like floating objects, using `backdrop-blur-2xl`, deep shadows, and subtle tinted borders (`bg-emerald-500/10 border border-emerald-500/20`), avoiding generic flat white/gray cards.

## 5. Components

### Buttons
- **Shape:** Softly rounded (`10px` default, or full-pill for specific brand buttons).
- **Primary:** Athletic Emerald (`#00D98B`) background with Crisp Ink inverse text.
- **Hover / Focus:** Transitions to Emerald Hover (`#00C47E`) and often utilizes the `button-shine` micro-animation.

### Cards / Containers
- **Corner Style:** Medium radius (`10px`) or Large (`14px`) for feature cards.
- **Background:** Raised Surface (`#111F3A` in dark mode).
- **Shadow Strategy:** `shadow-sm` at rest, lifting to `shadow-md` on hover if interactive.
- **Border:** Subtle default border (`rgba(139, 153, 168, 0.15)`).

### Feedback Banners & Toasts
- **Style:** The signature "Dark Pill". `rounded-xl`, `backdrop-blur-2xl`, with a 10% opacity background of the semantic color and a 20% opacity border of the same color.
- **State:** Emerald for success, Red (`#F04848`) for destructive/error.

## 6. Do's and Don'ts

### Do:
- **Do** use the dark "pill" aesthetic for success and error messages (`bg-[color]-500/10 border-[color]-500/20` with `backdrop-blur-2xl` and shadow).
- **Do** maintain the 8px spacing scale strictly.
- **Do** use `shadow-glow` (`0 0 24px rgba(0, 217, 139, 0.18)`) for active, premium focal points.

### Don't:
- **Don't** use generic white/gray cards or heavy iOS-style opaque blurs for toasts and alerts.
- **Don't** use glowing neon blobs unstructured; glow must be intentional and tied to the primary accent.
- **Don't** use generic, flat, template-like SaaS layouts; ensure data tables for owners are structured, clean, and use interactive surface row hovers.
- **Don't** use side-stripe borders (e.g., `border-left` greater than 1px) as colored accents on cards or callouts.
