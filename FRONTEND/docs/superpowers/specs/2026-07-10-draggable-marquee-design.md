# Draggable Marquee Design

## Purpose
Convert the static CSS-animated "Trusted By" marquee into a tactile, physics-based draggable component where users can swipe horizontally. After a swipe interaction ends, the marquee will seamlessly resume automatic scrolling after a brief delay.

## Architecture & Data Flow
- **Framework:** Framer Motion (`framer-motion`) will handle the animation and drag physics.
- **Component:** The marquee in `LandingPage.tsx` will be extracted to a new client-side component `DraggableMarquee.tsx`.
- **Physics Mechanism:** 
  - An underlying Framer Motion `useAnimationFrame` will constantly increase/decrease the horizontal translation.
  - A wrapping `<motion.div drag="x">` will allow the user to throw the element.
  - During a `drag` event, the automatic frame loop is paused.
  - On `dragEnd`, we set a `setTimeout` (e.g., 2 seconds). When the timeout fires, the frame loop resumes seamlessly from the exact dragged coordinate.
  - The seamless loop is achieved by mapping the `x` value modulo the total width of one "set" of logos, so it never physically runs out of track.

## Error Handling & Edge Cases
- **Fast Swipes:** If the user throws it hard, the spring physics will decay naturally before the auto-scroll resumes.
- **Continuous Touching:** The 2-second timeout will clear and reset on every new `dragStart` so it doesn't resume while the user is still interacting.

## Testing
- Verify smooth physics on drag.
- Verify the auto-resume occurs exactly 2 seconds after the drag momentum settles.
- Verify the infinite loop math works perfectly (no visual jumps when the modulo resets the position).
- If this proves too jittery on certain devices, we have agreed to fallback to Option B (Embla AutoScroll).
