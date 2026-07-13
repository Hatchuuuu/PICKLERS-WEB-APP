import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import * as Sentry from "@sentry/react";
import App from "./app/App.tsx";
import "./styles/index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1, 
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);