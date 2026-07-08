import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { LandingPage } from "@/pages/public/LandingPage";
import { AuthPage } from "@/pages/public/AuthPage";

import { AppShellLayout } from "@/layouts/AppShellLayout";
import { PlayTab } from "@/pages/player/PlayTab";
import { ExploreTab } from "@/pages/player/ExploreTab";
import { BookingsTab } from "@/pages/player/BookingsTab";
import { CommunityTab } from "@/pages/player/CommunityTab";
import { PlayerSettingsTab } from "@/pages/player/PlayerSettings";

import { OwnerLayout } from "@/layouts/OwnerLayout";
import { OwnerDashboard } from "@/pages/owner/OwnerDashboard";
import { OwnerCourts } from "@/pages/owner/OwnerCourts";
import { OwnerTournaments } from "@/pages/owner/OwnerTournaments";
import { OwnerStaff } from "@/pages/owner/OwnerStaff";
import { OwnerSettings } from "@/pages/owner/OwnerSettings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Player Shell Routes */}
        <Route path="/app" element={<AppShellLayout />}>
          <Route index element={<PlayTab />} />
          <Route path="explore" element={<ExploreTab />} />
          <Route path="bookings" element={<BookingsTab />} />
          <Route path="community" element={<CommunityTab />} />
          <Route path="settings" element={<PlayerSettingsTab />} />
        </Route>

        {/* Owner Shell Routes */}
        <Route path="/app/owner" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="courts" element={<OwnerCourts />} />
          <Route path="tournaments" element={<OwnerTournaments />} />
          <Route path="staff" element={<OwnerStaff />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
