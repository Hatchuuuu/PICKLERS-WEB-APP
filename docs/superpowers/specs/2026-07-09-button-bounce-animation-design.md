# Button Bounce Animation Design

## Overview
Add a playful, staggered "attention-bounce" animation to the primary call-to-action buttons in the hero section ("Book a Court" and "Join Open Play") to encourage user interaction.

## Architecture & Implementation
1. **CSS Keyframes**: 
   - Define `@keyframes attention-bounce` in `index.css`.
   - The animation will be an 8-second loop.
   - 0% - 15%: A quick, springy double-jump (`translateY(-20%)`, `translateY(0)`, `translateY(-10%)`, `translateY(0)`).
   - 15% - 100%: Static rest.
2. **Component Updates (`LandingPage.tsx`)**:
   - Add the animation class `animate-[attention-bounce_8s_infinite]` to both buttons.
   - Apply `style={{ animationDelay: '0s' }}` to the first button (optional, but good for explicitness).
   - Apply `style={{ animationDelay: '2s' }}` to the second button.

## Success Criteria
- The "Book a Court" button jumps periodically.
- The "Join Open Play" button jumps exactly 2 seconds after the first button starts its jump.
- The animation is smooth and does not interfere with clickability or layout.
