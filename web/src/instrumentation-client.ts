// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // 5% trace sampling in production (adjust if you need more)
  tracesSampleRate: 0.05,
  // Disable log forwarding to Sentry — keeps costs manageable
  enableLogs: false,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: 0.05,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {},
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
