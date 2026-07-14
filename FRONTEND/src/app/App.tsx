import { useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

import { LandingPage } from "@/pages/public/LandingPage";
import { AuthPage } from "@/pages/public/AuthPage";

import { AppShellLayout } from "@/layouts/AppShellLayout";
import { PlayTab } from "@/pages/player/PlayTab";
import { BookingsTab } from "@/pages/player/BookingsTab";
import { CommunityTab } from "@/pages/player/CommunityTab";
import { PlayerSettingsTab } from "@/pages/player/PlayerSettings";
import { OwnerApplication } from "@/pages/player/OwnerApplication";
import { FacilityDetailView } from "@/pages/player/FacilityDetailView";

const ExploreTab = lazy(() => import("@/pages/player/ExploreTab").then(m => ({ default: m.ExploreTab })));
const OwnerLayout = lazy(() => import("@/layouts/OwnerLayout").then(m => ({ default: m.OwnerLayout })));
const OwnerDashboard = lazy(() => import("@/pages/owner/OwnerDashboard").then(m => ({ default: m.OwnerDashboard })));
const OwnerCourts = lazy(() => import("@/pages/owner/OwnerCourts").then(m => ({ default: m.OwnerCourts })));
const OwnerTournaments = lazy(() => import("@/pages/owner/OwnerTournaments").then(m => ({ default: m.OwnerTournaments })));
const OwnerBracket = lazy(() => import("@/pages/owner/OwnerBracket").then(m => ({ default: m.OwnerBracket })));
const OwnerStaff = lazy(() => import("@/pages/owner/OwnerStaff").then(m => ({ default: m.OwnerStaff })));
const OwnerSettings = lazy(() => import("@/pages/owner/OwnerSettings").then(m => ({ default: m.OwnerSettings })));

import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { OwnerProvider } from "@/contexts/OwnerContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleGate } from "@/components/shared/RoleGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTournamentStore } from "@/store/useTournamentStore";

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="w-full min-h-screen flex flex-col"
    >
      <Suspense fallback={
        <div className="w-full h-full flex-1 min-h-[50vh] flex items-center justify-center bg-background">
          <div className="w-12 h-12 rounded-xl bg-surface-interactive border border-border shadow-sm flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Create a stable key for major layout shifts (Auth <-> App)
  const rootPath = location.pathname.split('/')[1] || '/';

  useEffect(() => {
    const path = location.pathname;
    let title = "PICKLERS | FIND • BOOK • PLAY";

    if (path === "/auth") title = "PICKLERS | Authentication";
    else if (path.startsWith("/app/owner")) {
      if (path === "/app/owner") title = "PICKLERS | Owner Dashboard";
      else if (path === "/app/owner/courts") title = "PICKLERS | Manage Courts";
      else if (path === "/app/owner/tournaments") title = "PICKLERS | Tournaments";
      else if (path === "/app/owner/staff") title = "PICKLERS | Staff Management";
      else if (path === "/app/owner/settings") title = "PICKLERS | Owner Settings";
      else title = "PICKLERS | Owner Portal";
    } else if (path.startsWith("/app")) {
      if (path === "/app") title = "PICKLERS | Player Dashboard";
      else if (path === "/app/explore") title = "PICKLERS | Explore";
      else if (path === "/app/bookings") title = "PICKLERS | My Bookings";
      else if (path === "/app/community") title = "PICKLERS | Community";
      else if (path === "/app/settings") title = "PICKLERS | Settings";
      else if (path === "/app/owner-application") title = "PICKLERS | Partner Application";
      else title = "PICKLERS | App";
    }

    document.title = title;
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={rootPath}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Player Shell Routes */}
          <Route path="/app" element={<PageTransition><AppShellLayout /></PageTransition>}>
            <Route index element={<PlayTab />} />
            <Route path="explore" element={<ExploreTab />} />
            <Route path="bookings" element={<BookingsTab />} />
            <Route path="community" element={<CommunityTab />} />
            <Route path="settings" element={<PlayerSettingsTab />} />
            <Route path="owner-application" element={<OwnerApplication />} />
            <Route path="facility/:id" element={<PageTransition><FacilityDetailView /></PageTransition>} />
          </Route>

          {/* Owner Shell Routes */}
          <Route element={<RoleGate role="owner" />}>
            <Route element={<OwnerProvider><Outlet /></OwnerProvider>}>
              <Route path="/app/owner" element={<PageTransition><OwnerLayout /></PageTransition>}>
                <Route index element={<OwnerDashboard />} />
                <Route path="courts" element={<OwnerCourts />} />
                <Route path="tournaments" element={<OwnerTournaments />} />
                <Route path="tournaments/:id" element={<OwnerBracket />} />
                <Route path="staff" element={<OwnerStaff />} />
                <Route path="settings" element={<OwnerSettings />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const hydrateFromSupabase = useTournamentStore(state => state.hydrateFromSupabase);

  useEffect(() => {
    hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <AnimatedRoutes />
              </ErrorBoundary>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
