"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp,
  Volume2,
  VolumeX,
  Navigation2,
  Compass,
  ExternalLink,
} from "lucide-react";
import L from "leaflet";

import { useToast } from "@/contexts/ToastContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchDirectionsRoute, calculateHaversineDistance, type RouteStep } from "@/lib/navigation/routingService";

interface NavigationOverlayProps {
  destination?: string;
  destLat?: number;
  destLng?: number;
  onClose: () => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Default coordinates for Manila/BGC pickleball hubs if not passed
const DEFAULT_MANILA_DESTINATIONS: Record<string, [number, number]> = {
  "BGC Pickleball Hub": [121.0509, 14.5547],
  "Metro Smashers Hub": [121.0509, 14.5547],
  "Green Valley Courts": [121.0425, 14.6508],
  "Elite Pickleball Center": [121.0244, 14.5547],
  "Makati Sports & Pickleball Club": [121.0244, 14.5547],
};

export function NavigationOverlay({
  destination = "BGC Pickleball Hub",
  destLat,
  destLng,
  onClose,
}: NavigationOverlayProps) {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  // Navigation metrics
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<RouteStep | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Geolocation
  const geo = useGeolocation(true);

  // Target destination coordinates [lng, lat]
  const targetDestinationCoords: [number, number] =
    destLat && destLng
      ? [destLng, destLat]
      : DEFAULT_MANILA_DESTINATIONS[destination] || [121.0509, 14.5547];

  // User coordinates [lng, lat]
  const userCoords: [number, number] =
    geo.longitude && geo.latitude
      ? [geo.longitude, geo.latitude]
      : [121.0225, 14.5500];

  const externalGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetDestinationCoords[1]},${targetDestinationCoords[0]}`;

  // 1. Fetch Routing Data
  const loadRoute = useCallback(
    async (origin: [number, number], dest: [number, number]) => {
      setIsRerouting(true);
      const result = await fetchDirectionsRoute(origin, dest, MAPBOX_TOKEN);

      if (result) {
        setDurationSec(result.durationSeconds);
        setDistanceMeters(result.distanceMeters);
        setRouteCoords(result.coordinates);
        if (result.steps.length > 0) {
          setCurrentStep(result.steps[0]);
        }
      } else {
        // Fallback estimated distance & duration
        const directDist = calculateHaversineDistance(
          [origin[1], origin[0]],
          [dest[1], dest[0]]
        );
        setDistanceMeters(directDist);
        setDurationSec(Math.round((directDist / 1000 / 30) * 3600)); // 30 km/h avg speed
        setRouteCoords([origin, dest]);
        setCurrentStep({
          distance: Math.min(300, directDist),
          duration: Math.round(directDist / 8),
          name: "Direct Route to " + destination,
          maneuver: {
            instruction: `Head straight towards ${destination}`,
            type: "turn",
            location: origin,
            distance: Math.min(300, directDist),
          },
        });
      }
      setIsRerouting(false);
    },
    [destination]
  );

  // 2. Initialize Leaflet DOM Map Engine (OpenStreetMap Tiles)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [userCoords[1], userCoords[0]],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    leafletMapRef.current = map;

    // OpenStreetMap Standard Tile Layer
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Create Venue Destination Marker (Emerald Pickleball Paddle)
    const destIcon = L.divIcon({
      className: "custom-venue-icon",
      html: `<div style="width:38px;height:38px;border-radius:50%;background:#10b981;border:2px solid #ffffff;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 10px 25px rgba(16,185,129,0.6);">🏓</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    L.marker([targetDestinationCoords[1], targetDestinationCoords[0]], { icon: destIcon }).addTo(map);

    // Create User Location Marker (Cyan Pulse Marker)
    const playerIcon = L.divIcon({
      className: "custom-player-icon",
      html: `<div style="width:26px;height:26px;border-radius:50%;background:#06b6d4;border:3px solid #ffffff;box-shadow:0 0 25px #06b6d4;"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const playerMarker = L.marker([userCoords[1], userCoords[0]], { icon: playerIcon }).addTo(map);
    playerMarkerRef.current = playerMarker;

    // Create Route Polyline Layer
    const initialLatLnts: L.LatLngExpression[] =
      routeCoords.length > 0
        ? routeCoords.map(([lng, lat]) => [lat, lng])
        : [
            [userCoords[1], userCoords[0]],
            [targetDestinationCoords[1], targetDestinationCoords[0]],
          ];

    const polyline = L.polyline(initialLatLnts, {
      color: "#06b6d4",
      weight: 6,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    polylineRef.current = polyline;

    // Fit map bounds to show route and trigger resize
    setTimeout(() => {
      map.invalidateSize();
      if (routeCoords.length > 1) {
        const bounds = L.latLngBounds(routeCoords.map(([lng, lat]) => [lat, lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 150);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []); // Run once on mount

  // 3. Initial Route Fetch
  useEffect(() => {
    loadRoute(userCoords, targetDestinationCoords);
  }, []);

  // 4. Update Markers & Polyline on Location / Route Changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (playerMarkerRef.current) {
      playerMarkerRef.current.setLatLng([userCoords[1], userCoords[0]]);
    }

    if (polylineRef.current && routeCoords.length > 0) {
      const latLngs: L.LatLngExpression[] = routeCoords.map(([lng, lat]) => [lat, lng]);
      polylineRef.current.setLatLngs(latLngs);
    }

    // Check Arrival Distance (< 20 meters)
    const distToDest = calculateHaversineDistance(
      [userCoords[1], userCoords[0]],
      [targetDestinationCoords[1], targetDestinationCoords[0]]
    );

    if (distToDest < 20 && !hasArrived) {
      setHasArrived(true);
      showToast(`You have arrived at ${destination}! 🏓`, "success");
    }
  }, [geo.latitude, geo.longitude, routeCoords]);

  // Recenter map camera on user position
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([userCoords[1], userCoords[0]], 16, {
        animate: true,
        duration: 1.2,
      });
      showToast("Centered on your current position", "success");
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showToast(isMuted ? "Voice guidance turned ON" : "Voice guidance muted", "success");
  };

  const openExternalMaps = () => {
    window.open(externalGoogleMapsUrl, "_blank");
    showToast("Launching Google Maps App...", "success");
  };

  const formatTimeMinutes = (sec: number | null) => {
    if (!sec) return "7 min";
    const mins = Math.ceil(sec / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} hr ${remMins} min`;
    }
    return `${mins} min`;
  };

  const formatDistanceKm = (meters: number | null) => {
    if (!meters) return "3.1 km";
    return (meters / 1000).toFixed(1) + " km";
  };

  const getEtaTimestamp = (sec: number | null) => {
    const now = new Date();
    const addSec = sec || 420;
    const etaDate = new Date(now.getTime() + addSec * 1000);
    return etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-slate-950 select-none text-slate-100"
      >
        {/* ===== REAL INTERACTIVE DOM MAP CANVAS (LEAFLET OPENSTREETMAP) ===== */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" style={{ background: "#020617" }} />
        </div>

        {/* ===== TOP: NEXT MANEUVER HEADER (Compact Waze Emerald) ===== */}
        <div className="relative z-20 pt-10 sm:pt-12 px-3.5 pointer-events-none">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 26 }}
            className="pointer-events-auto rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)] bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-slate-950/95 border border-emerald-500/30 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Turn Direction Icon */}
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                <ArrowUp className="w-7 h-7 stroke-[3]" />
              </div>

              {/* Maneuver Details */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono font-black text-sm">
                    {currentStep ? `${Math.round(currentStep.distance)} m` : "300 m"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    NEXT TURN
                  </span>
                  {isRerouting && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 animate-pulse">
                      Rerouting...
                    </span>
                  )}
                </div>
                <span className="text-white font-bold text-[14px] leading-snug truncate">
                  {currentStep?.maneuver.instruction || `Head straight towards ${destination}`}
                </span>
                <span className="text-slate-400 text-xs truncate">
                  {destination} • Court Navigation
                </span>
              </div>

              {/* External App Launcher */}
              <button
                onClick={openExternalMaps}
                className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                title="Launch Google Maps"
              >
                <ExternalLink className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* ===== FLOATING CONTROLS ===== */}
        <div className="absolute left-3.5 z-20 pointer-events-auto" style={{ bottom: "140px" }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRecenter}
            className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 text-slate-200 pl-3 pr-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Navigation2 className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span className="text-xs font-bold">Re-center</span>
          </motion.button>
        </div>

        <div className="absolute right-3.5 flex flex-col gap-2.5 z-20 pointer-events-auto" style={{ bottom: "140px" }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openExternalMaps}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-xl backdrop-blur-xl text-slate-300 hover:text-white cursor-pointer"
            title="External Google Maps App"
          >
            <Compass className="w-5 h-5 text-emerald-400" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-xl backdrop-blur-xl text-slate-300 hover:text-white cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-slate-200" />}
          </motion.button>
        </div>

        {/* ===== ARRIVAL MODAL ===== */}
        {hasArrived && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 z-[600] flex items-center justify-center p-6 text-center">
            <div className="p-6 rounded-3xl border border-border dark:border-white/12 bg-surface-overlay dark:bg-[#13223F] shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col items-center gap-3 max-w-sm z-[610]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-2xl">
                🏓
              </div>
              <h3 className="text-xl font-black text-foreground">You've Arrived!</h3>
              <p className="text-xs text-muted-foreground">{destination}</p>
              <button
                onClick={onClose}
                className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-md cursor-pointer"
              >
                Done & Return to Bookings
              </button>
            </div>
          </div>
        )}

        {/* ===== BOTTOM ETA SHEET ===== */}
        <div className="mt-auto relative z-30 w-full pointer-events-auto">
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-surface-overlay border-t border-border rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between gap-4">
              {/* ETA & Distance */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-black text-3xl tracking-tight leading-none">
                    {formatTimeMinutes(durationSec)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold shrink-0">
                    Fastest
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-semibold mt-1.5 flex items-center gap-2 truncate">
                  <span>{formatDistanceKm(distanceMeters)}</span>
                  <span>•</span>
                  <span>ETA {getEtaTimestamp(durationSec)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 pr-8">
                <button
                  onClick={openExternalMaps}
                  className="px-4 py-2.5 rounded-xl border border-border bg-surface-interactive text-xs font-bold text-foreground hover:bg-surface-interactive/80 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Google Maps</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Exit Navigation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
