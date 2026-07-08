const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const appFile = path.join(srcDir, 'app', 'App.tsx');
const code = fs.readFileSync(appFile, 'utf8');

function mkdir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

mkdir(path.join(srcDir, 'lib'));
mkdir(path.join(srcDir, 'data'));
mkdir(path.join(srcDir, 'components', 'ui'));
mkdir(path.join(srcDir, 'components', 'shared'));
mkdir(path.join(srcDir, 'components', 'modals'));
mkdir(path.join(srcDir, 'pages', 'public'));
mkdir(path.join(srcDir, 'pages', 'player'));
mkdir(path.join(srcDir, 'pages', 'owner'));
mkdir(path.join(srcDir, 'layouts'));

const destMap = {
  "Mock Data": "data/mockData.ts",
  "Utilities": "lib/utils.ts",
  "Shared Components": "components/ui/shared.tsx",
  "Facility Card": "components/shared/FacilityCard.tsx",
  "Match Card": "components/shared/MatchCard.tsx",
  "Picklers Logo": "components/ui/PicklersLogo.tsx",
  "Time Slot Helpers": "lib/timeUtils.ts",
  "Payment View": "components/modals/PaymentView.tsx",
  "Quick Book Modal": "components/modals/QuickBookModal.tsx",
  "Facility Detail View": "pages/player/FacilityDetailView.tsx",
  "Landing Page": "pages/public/LandingPage.tsx",
  "Auth Page": "pages/public/AuthPage.tsx",
  "Player Shell": "layouts/AppShellLayout.tsx",
  "Play Tab": "pages/player/PlayTab.tsx",
  "Explore Tab": "pages/player/ExploreTab.tsx",
  "Bookings Tab": "pages/player/BookingsTab.tsx",
  "Community Tab": "pages/player/CommunityTab.tsx",
  "Player Settings": "pages/player/PlayerSettings.tsx",
  "Owner Shell": "layouts/OwnerLayout.tsx",
  "Court Card (Owner Dashboard)": "pages/owner/CourtCard.tsx",
  "Walk-in Modal": "components/modals/WalkinModal.tsx",
  "Owner Dashboard": "pages/owner/OwnerDashboard.tsx",
  "Owner Courts": "pages/owner/OwnerCourts.tsx",
  "Owner Tournaments": "pages/owner/OwnerTournaments.tsx",
  "Owner Staff": "pages/owner/OwnerStaff.tsx",
  "Owner Settings": "pages/owner/OwnerSettings.tsx",
  "App Root": "App.tsx"
};

const standardImports = `import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Star, Clock, Heart, ChevronRight, Search, Bell,
  LayoutDashboard, Map, CalendarDays, Users, Settings,
  Trophy, UserCheck, Plus, X, Check, AlertTriangle,
  Wallet, LogOut, Menu, CreditCard,
  ArrowRight, PlayCircle, Radio, MessageCircle, Send, ChevronLeft, Calendar, FileText, Smartphone,
  Info, Camera, ArrowDownToLine, Phone, Zap
} from "lucide-react";
import { cn, formatTime, levelColor, statusColor, useCountUp } from "@/lib/utils";
import { slotIndex, slotHours, TIME_SLOTS } from "@/lib/timeUtils";
import { FACILITIES, OPEN_MATCHES, BOOKINGS, LIVE_COURTS, BOOKING_REQUESTS, FACILITY_COURTS, TOURNAMENTS, type CourtData, type PaymentData } from "@/data/mockData";
import { CapacityRing, Toggle } from "@/components/ui/shared";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { MatchCard } from "@/components/shared/MatchCard";
import { PaymentView } from "@/components/modals/PaymentView";
import { QuickBookModal } from "@/components/modals/QuickBookModal";
import { WalkinModal } from "@/components/modals/WalkinModal";
import { CourtCard } from "@/pages/owner/CourtCard";
import { FacilityDetailView } from "@/pages/player/FacilityDetailView";
import { LandingPage } from "@/pages/public/LandingPage";
import { AuthPage } from "@/pages/public/AuthPage";
import { PlayTab } from "@/pages/player/PlayTab";
import { ExploreTab } from "@/pages/player/ExploreTab";
import { BookingsTab } from "@/pages/player/BookingsTab";
import { CommunityTab } from "@/pages/player/CommunityTab";
import { PlayerSettings } from "@/pages/player/PlayerSettings";
import { OwnerDashboard } from "@/pages/owner/OwnerDashboard";
import { OwnerCourts } from "@/pages/owner/OwnerCourts";
import { OwnerTournaments } from "@/pages/owner/OwnerTournaments";
import { OwnerStaff } from "@/pages/owner/OwnerStaff";
import { OwnerSettings } from "@/pages/owner/OwnerSettings";
import { AppShellLayout } from "@/layouts/AppShellLayout";
import { OwnerLayout } from "@/layouts/OwnerLayout";
`;

const sections = code.split('\n// ─── ');
let currentDataStr = "";

sections.forEach((sec, idx) => {
  if (idx === 0) return; // Skip imports header
  
  const newlineIdx = sec.indexOf('\n');
  let title = sec.substring(0, newlineIdx).replace(/─/g, '').trim();
  let content = sec.substring(newlineIdx + 1);

  if (title === "Payment View") {
    // Extract types
    const cMatch = content.match(/type CourtData = [^\n]+;/);
    const pMatch = content.match(/type PaymentData = \{[\s\S]+?\};/);
    if (cMatch) {
      currentDataStr += "\nexport " + cMatch[0];
      content = content.replace(cMatch[0], "");
    }
    if (pMatch) {
      currentDataStr += "\nexport " + pMatch[0];
      content = content.replace(pMatch[0], "");
    }
  }

  // Add export keyword
  content = content.replace(/^const ([A-Z_]+) = /gm, 'export const $1 = ');
  content = content.replace(/^function ([a-zA-Z0-9_]+)\(/gm, 'export function $1(');
  
  if (title === "Mock Data") {
    currentDataStr = content + currentDataStr;
    fs.writeFileSync(path.join(srcDir, destMap[title]), standardImports + "\n" + currentDataStr);
  } else if (title !== "App Root" && destMap[title]) {
    const dest = destMap[title];
    fs.writeFileSync(path.join(srcDir, dest), standardImports + "\n" + content);
  }
});

console.log("Refactoring script finished.");
