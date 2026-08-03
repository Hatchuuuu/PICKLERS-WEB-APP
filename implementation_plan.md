# Implementation Plan for Picklers Web App Optimization

## Phase 1: Orphaned File & Dead Code Cleanup - COMPLETED

### Files Removed:
1. **Import files/images** (verified unused and removed):
   - `web/src/imports/*.PNG` (9 files) - DELETED
   - `web/src/imports/*.png` (10 files) - DELETED
   - `web/src/imports/PICKLERS_LOGO.svg` - DELETED
   - `web/src/imports/image.png` - DELETED

### Dead Code Removed:
- **Console.log statements**: 
  - Removed success log in `web/src/app/api/payments/webhook/route.ts` (line: `console.log(\`Successfully credited \${amountToAdd} to user \${metadata.user_id}\`);`)

### Files to Analyze for Removal:
1. **Test files** (verify if actually used):
   - `web/src/__tests__/app/page.test.tsx`
   - `web/src/__tests__/hooks/useAuthForm.test.ts`
   - `web/src/__tests__/app\(player)\app\bookings\page.test.tsx`

2. **Duplicate/Redundant files**:
   - Check for any duplicate component implementations

### Dead Code to Remove:
- Commented-out code blocks
- Unused imports/variables
- Unused hooks/utilities

## Phase 2: Performance & Bottleneck Optimization

### Render Optimization Opportunities:
1. **Large components needing React.memo/useMemo/useCallback**:
   - `web/src/app/page.tsx` (LandingPage) - 990 lines
   - `web/src/components/community/FeedTab.tsx` - 767 lines
   - `web/src/components/owner/CreateTournamentModal.tsx` - 715 lines
   - `web/src/components/tournament/BracketCanvas.tsx` - 590 lines

2. **Animation optimization**:
   - Review `motion/react` usage for excessive re-renders
   - Consider using `useMotionValue` and `useTransform` more efficiently
   - Check for unnecessary `AnimatePresence` wrappers

### Data Fetching Optimization:
1. **Supabase/API calls to analyze**:
   - `web/src/app/page.tsx` lines 83-106: Facilities and matches loading
   - `web/src/app/(player)/app/explore/page.tsx`: Map and facility data
   - `web/src/hooks/useAuthForm.ts`: Authentication flows
   - `web/src/contexts/AppContext.ts`: Various data fetching

2. **N+1 query risks**:
   - Facility court loading patterns
   - Match/participant data loading
   - User profile associations

### Bundle Size Optimization:
1. **Heavy imports to evaluate for dynamic loading**:
   - `mapbox-gl` (in explore page)
   - `motion` (framer motion) - used throughout
   - `react-map-gl` 
   - `canvas-confetti`
   - `recharts` (charts/graphs)

2. **Components for lazy loading (next/dynamic)**:
   - Tournament brackets (only needed on tournament pages)
   - Map components (only on explore/facility detail pages)
   - Complex modals (only when triggered)
   - Chat components (only on community pages)

## Phase 3: Clean Code & Maintainability

### Code Smells to Address:
1. **Duplicated logic**:
   - Animation patterns (repeated motion.div configurations)
   - Modal structures (similar header/body/footer patterns)
   - Form validation patterns
   - Loading/skeleton states

2. **Type safety improvements**:
   - Replace `any` types (seen in useAuthForm.ts and elsewhere)
   - Improve Zod validation usage
   - Strengthen TypeScript interfaces

3. **File structure improvements**:
   - Split large components:
     - Break `page.tsx` into section components
     - Extract animation utilities
     - Create reusable modal components
     - Separate concern-specific hooks

### Specific Refactoring Targets:
1. **web/src/app/page.tsx** (990 lines) - Split into:
   - NavbarSection.tsx
   - HeroSection.tsx
   - PartnersMarquee.tsx
   - StatsSection.tsx
   - ToggleSection.tsx
   - VenuesSection.tsx
   - BentoFeaturesSection.tsx
   - TestimonialsSection.tsx
   - HowItWorksSection.tsx
   - FAQSection.tsx
   - AIChatSection.tsx
   - FooterSection.tsx

2. **web/src/components/owner/CreateTournamentModal.tsx** (715 lines) - Split into:
   - TournamentForm wizard steps as separate components
   - BracketPreview component
   - TeamManagement component
   - ScheduleSettings component

3. **web/src/components/tournament/BracketCanvas.tsx** (590 lines) - Consider:
   - Extraction of drawing logic to utility functions
   - Separation of interaction handlers
   - Creation of reusable node/edge components

## Phase 4: Safe Execution Workflow

### Step 1: Analysis Complete (This Document)
### Step 2: Execute Cleanup and Refactoring (After Approval)
### Step 3: Verify Changes (TypeScript checks, build success, functionality preserved)

## Detailed File-by-File Analysis Plan:

### A. Orphaned File Identification
1. Run npm ls --unused or similar to detect unused packages
2. Manually verify import files in web/src/imports/
3. Check if test files are actually referenced in package.json test scripts

### B. Performance Optimization Details
1. **useMemo/useCallback targets**:
   - Memoize expensive computations in rendering loops
   - Callback stabilization for memoized child components
   - Memoize context values to prevent unnecessary provider re-renders

2. **Data fetching improvements**:
   - Replace sequential awaits with Promise.all() where appropriate
   - Implement query caching/stale-while-revalidate patterns
   - Add request deduplication for identical calls

3. **Bundle optimization**:
   - Convert heavy imports to dynamic imports where appropriate
   - Audit and optimize lodash/moment usage if present
   - Implement route-based code splitting

### C. Maintainability Improvements
1. **Utility extraction**:
   - Create `lib/animations.js` for common motion patterns
   - Create `lib/formUtils.js` for validation helpers
   - Create `lib/authHelpers.js` for auth-related utilities

2. **Component standardization**:
   - Create base Modal component with consistent header/body/footer
   - Create base Button variants with consistent styling
   - Create base Card component with consistent layout

3. **Type safety enhancements**:
   - Convert any types to proper interfaces
   - Improve Zod schemas for better validation
   - Add exhaustive switch statement checks

## Verification Checklist:
- [x] TypeScript compilation passes with no new errors (after orphaned file removal)
- [ ] Development server starts successfully
- [ ] All existing routes load correctly
- [ ] Core functionality (auth, booking, payments) works
- [ ] No visual/UI changes introduced (per requirements)
- [ ] Bundle size analysis shows improvement or no regression