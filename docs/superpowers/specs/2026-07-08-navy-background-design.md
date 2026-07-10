# Navy Background Restoration Design

## Objective
Revert the core application background colors from the newly applied charcoal (`#0C1117`) back to the original deep navy blue (`#0A1628`), while maintaining the new vibrant Emerald green (`#00D98B`) brand identity.

## Changes Required

### 1. CSS Theme Tokens (`src/styles/theme.css`)
Update the surface color palette to use the navy blue values:
- `--surface-base`: `#0A1628`
- `--surface-raised`: `#111F3A`
- `--surface-overlay`: `#162849`
- `--surface-interactive`: `#1C3258`

### 2. Hardcoded Gradients and Overlays
Search for and replace all instances of the charcoal RGBA values (`rgba(12, 17, 23, x)`) with the navy RGBA values (`rgba(10, 22, 40, x)`). This affects:
- `LandingPage.tsx`: Navbar background
- `FacilityCard.tsx`: Card gradients and hover states
- `FacilityDetailView.tsx`: Hero image gradients and back button
- `BookingsTab.tsx`: Toast notification backgrounds
- `OwnerLayout.tsx`: Sidebar and mobile nav background
- `AppShellLayout.tsx`: Sidebar and mobile nav background

## Consistency
The emerald green (`#00D98B`) and its corresponding glows (`rgba(0, 217, 139, x)`) will remain untouched. White text (`var(--ink-primary)`) will remain as is since it provides excellent contrast against both charcoal and navy.
