Act as an Enterprise iOS Solutions Architect.

I am planning to build the iOS mobile application for my web app, Picklers. I am a second-year BSIT student working on a strict MVP budget, so my core goals are reusing my web code, minimizing hardware costs, and passing Apple's strict App Store Review guidelines.

Here is my current, finalized web technology stack:

Frontend: React (Vite), TypeScript, Tailwind CSS v4, Radix UI, Framer Motion, GSAP

Backend & DB: Next.js (App Router, Edge Runtime) + Supabase (PostgreSQL, RLS, Storage)

Auth: Supabase Auth (Email OTP, Phone OTP, Google/Meta OAuth)

State Management: Zustand + TanStack React Query

Key Integrations: Paymongo (GCash, Maya, QR Ph), Sentry, PostHog, Upstash Redis

Please design the absolute best iOS Mobile Technology Stack for my project. Address the following areas in detail:

1. iOS App Wrapper (Capacitor vs. React Native/Expo): Provide a definitive recommendation. Explain how I can reuse my exact TypeScript, React, and Tailwind code.
2. iOS Hardware Workarounds: Xcode and macOS are typically required to build iOS apps. If I am developing on a Windows PC on a student budget, what free or ultra-low-cost cloud build options (e.g., EAS Build, Codemagic, GitHub Actions) can I use to compile my .ipa file?
3. Apple Review Compliance (Sign in with Apple): Apple Guideline 4.8 requires apps offering third-party logins (like Google/Meta) to also offer "Sign in with Apple." Explain how to integrate "Sign in with Apple" securely using Supabase Auth on iOS.
4. Philippine Mobile Payment Flows (GCash/Maya): How do we handle Paymongo redirects inside the iOS app? Detail how to implement Safari View Controller or Deep Linking so that when a player finishes paying via the GCash app, they are routed back to the Picklers iOS app seamlessly.
5. iOS Push Notifications & App Store Submission: What is the cheapest/best way to handle iOS push notifications (APNs via Firebase)? Briefly list the developer account requirements and certificates needed to submit the app to Apple's TestFlight.