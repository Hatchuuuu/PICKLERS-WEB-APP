"use client";

import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/contexts/ToastContext";
import { InitUserStore } from "@/components/InitUserStore";
import { MobileDeepLinkProvider } from "@/components/providers/MobileDeepLinkProvider";
import { PushNotificationProvider } from "@/components/providers/PushNotificationProvider";

// Safe patch for browser extensions (Google Translate, Grammarly, etc.) that mutate DOM nodes directly
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient must be created inside the component to prevent
  // cross-request data leakage in Next.js SSR environments.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MobileDeepLinkProvider>
            <AuthProvider>
              <PushNotificationProvider>
                <AppProvider>
                  <InitUserStore />
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </AppProvider>
              </PushNotificationProvider>
            </AuthProvider>
          </MobileDeepLinkProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
