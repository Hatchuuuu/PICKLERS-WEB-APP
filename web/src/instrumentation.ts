import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = "https://b5acf81b3bc62e1f7e44219f32cea53a@o4511733491040256.ingest.us.sentry.io/4511734227730432";

export async function register() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1,
      enableLogs: true,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1,
      enableLogs: true,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
