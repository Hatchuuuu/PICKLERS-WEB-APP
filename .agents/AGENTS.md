# Picklers Web App Custom Rules

## Brand Identity & UI Consistency

### Toasts, Alerts, and Feedback Banners
The core brand identity for success and error messages uses a distinct, dark "pill" aesthetic rather than generic white/gray cards or heavy Apple-style blurs. Whenever creating or updating Toasts, Snackbars, or Inline Alerts, use the following exact Tailwind styling rules to ensure absolute consistency:

**1. Success States (Toasts, Inline Alerts, Success Banners)**
- Background: `bg-emerald-500/10`
- Border: `border border-emerald-500/20`
- Text & Icons: `text-emerald-500 dark:text-emerald-400`
- Optional enhancements: Subtle backdrop blur (`backdrop-blur-2xl`) and shadow (`shadow-[0_10px_40px_rgba(0,0,0,0.5)]` or similar) for floating elements.
- *Example component classes:* `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-emerald-500/10 border-emerald-500/20`

**2. Error / Destructive States**
- Background: `bg-red-500/10`
- Border: `border border-red-500/20`
- Text & Icons: `text-red-500 dark:text-red-400`
- *Example component classes:* `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-red-500/10 border-red-500/20`

**3. General Principles**
- Avoid large, glowing neon blobs inside small components like toasts.
- Keep the shape universally rounded, but NOT fully pill-shaped (`rounded-xl` instead of `rounded-full`).
