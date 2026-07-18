Act as an Enterprise Android Solutions Architect.

I am planning to build the Android mobile application for my web app, Picklers. I am a second-year BSIT student working on a strict MVP budget, so my core goals are maximum code reuse from my web app, zero-cost developer tools, and easy deployment to the Google Play Store.

Here is my current, finalized web technology stack:

Frontend: React (Vite), TypeScript, Tailwind CSS v4, Radix UI, Framer Motion, GSAP

Backend & DB: Next.js (App Router, Edge Runtime) + Supabase (PostgreSQL, RLS, Storage)

Auth: Supabase Auth (Email OTP, Phone OTP, Google/Meta OAuth)

State Management: Zustand + TanStack React Query

Key Integrations: Paymongo (GCash, Maya, QR Ph), Sentry, PostHog, Upstash Redis

Please design the absolute best Android Mobile Technology Stack for my project. Address the following areas in detail:

1. Android App Wrapper (Capacitor vs. React Native/Expo): Provide a definitive recommendation. Explain how I can reuse my exact TypeScript, React, and Tailwind code.
2. Development & Build Tools: What local IDE and SDK configurations (e.g., Android Studio, Gradle, JDK) do I need? How do I generate a test .apk and a production-ready .aab for the Play Store?
3. Authentication & State Sync: How will the Android app securely store authentication session tokens locally, and how does it keep the player lists and courts in sync with the cloud database?
4. Philippine Mobile Payment Flows (GCash/Maya): How do we handle Paymongo redirects inside the Android app without breaking the user session? Provide the logic or plugins needed to handle Deep Linking back into the app after a GCash payment is completed.
5. Android Push Notifications: What is the cheapest/best way to implement push notifications (e.g., Firebase Cloud Messaging) for match invites and booking confirmations? Provide the setup steps.