# Community UI/UX Overhaul Design Spec

## Overview
The Community section of Picklers is being overhauled to remove the basic, mobile-first "Tab Bar" look and replace it with a premium, professional "Social Hub" layout (resembling Strava, X, and Airbnb). The aesthetic shifts to "Soft, Deep & Playful" with large border radiuses and smooth diffused drop-shadows.

## 1. Architecture (3-Column Layout)
The layout on desktop will use a 3-column CSS Grid. On mobile, it will gracefully collapse into a single column with a bottom/top nav.

### Left Column: Navigation (Sticky)
- Acts as the main community router.
- **Items**: Feed, Messages, Discover, My Clubs.
- **Styling**: Large, pill-shaped buttons with clear active states.

### Center Column: Main Content (Scrollable)
- Constrained to `max-w-[600px]`.
- Hosts the Feed posts, or the Chat UI when a message is selected.
- Keeping it constrained ensures images have a consistent aspect ratio and text doesn't stretch uncomfortably.

### Right Column: Discover & Suggestions (Sticky)
- Hosts "People You May Know" and "Trending Clubs" in widget-style cards.
- Allows users to easily follow or join communities without leaving the feed.

## 2. Visual Aesthetic ("Soft & Playful")
- **Border Radius**: Use `rounded-3xl` (24px) or `rounded-2xl` (16px) for major cards, avoiding sharp corners.
- **Depth & Shadows**: Remove `border-subtle` from main feed cards and replace with `shadow-[0_8px_30px_rgba(0,0,0,0.06)]` (or similar soft diffused shadow) with a solid `bg-surface-base` or `bg-background` to pop against a slightly darker page background.
- **Typography**: Emphasize names and headings with `font-extrabold` or `font-bold`. Mute timestamps and secondary info.

## 3. Micro-Interactions (Emil Design Guidelines)
- **Active States**: All interactive buttons (Like, Comment, Nav items) must have `transform: scale(0.97)` on `:active`.
- **Modals & Dialogs**: `Create Post` or `Profile` popups will enter with a spring animation starting from `scale: 0.95, opacity: 0, y: 20`.

## 4. Component Refactoring Scope
- `CommunityPage`: Needs a layout rewrite from single-column + TabBar to the new 3-column CSS Grid.
- `FeedTab`: Will be placed in the center column. Post cards need CSS updates (shadows, border-radius).
- `MessagesTab` & `ChatPanel`: Will be integrated into the center column (or as an overlay) rather than a separate tab.
- `CommunityTab`: The elements inside (Players, Clubs) will be moved into the Right Column as sticky widgets.

## 5. Mobile Responsiveness
- Below `md` or `lg` breakpoints, the 3 columns collapse.
- The Left Column turns into a bottom or top horizontal scroll nav.
- The Right Column hides, or is placed below the feed.
