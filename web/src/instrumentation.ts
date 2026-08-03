import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn("NEXT_PUBLIC_SENTRY_DSN not set — Sentry is disabled.");
    return;
  }

  const tracesSampleRate =
    process.env.NODE_ENV === "production" ? 0.05 : 1;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate,
      enableLogs: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate,
      enableLogs: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
