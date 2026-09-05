"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Trophy } from "lucide-react";
import { MatchCard } from "@/components/shared/MatchCard";
import { useToast } from "@/contexts/ToastContext";
import { LockedFeatureWrapper } from "@/components/ui/LockedFeatureWrapper";
import { useTheme } from "next-themes";
import { useApp } from "@/contexts/AppContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MatchData, Booking } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MATCHES } from "@/lib/demoData";

export default function ExploreTab() {
  const [levelFilter, setLevelFilter] = useState("All");
  const [facilityFilter, setFacilityFilter] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { joinedMatches: joined, setJoinedMatches: setJoined, setBookings, setNotifications } = useApp();
  const { showToast } = useToast();
  const prevJoinedSize = useRef(joined.size);
  const { user } = useAuth();

  const { data: openMatches = [], isLoading } = useQuery({
    queryKey: ['matches', user?.id, levelFilter, facilityFilter],
    queryFn: async () => {
      let query = supabase.from('matches').select('*');

      // Apply level filter at the database level when filter is not "All"
      if (levelFilter !== "All") {
        query = query.eq('level', levelFilter);
      }

      // Apply facility filter at the database level when facility filter is specified
      if (facilityFilter.trim() !== "") {
        query = query.ilike('facility_name', `%${facilityFilter.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const isDemo = user?.isDemo || user?.role === "demo" || user?.role === "dev";
      if (isDemo && (!data || data.length === 0)) {
        return DEMO_MATCHES as any[];
      }

      return data || [];
    }
  });

  useEffect(() => {
    if (joined.size > prevJoinedSize.current) {
      showToast(`You've joined ${joined.size} match${joined.size > 1 ? "es" : ""}! Payment will be collected at the venue.`, "success");
      prevJoinedSize.current = joined.size;
    }
  }, [joined.size, showToast]);

  const levels = ["All", "Beginner", "Intermediate", "Advanced"];
  const filtered = openMatches;

  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          <motion.div 
            key="title" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Open Play
            </h1>
            <p className="text-sm text-muted-foreground">Connect, compete, and play without the hassle.</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {/* Level Filter Buttons */}
        <div className="flex gap-1.5">
          {levels.map(l => (
            <motion.button key={l} onClick={() => setLevelFilter(l)}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor: levelFilter === l ? "rgb(16 185 129)" : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"),
                color: levelFilter === l ? "#ffffff" : "var(--muted-foreground)",
                borderColor: levelFilter === l ? "rgb(16 185 129)" : "var(--border)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold tracking-wide border border-solid relative overflow-hidden cursor-pointer">
              {l}
            </motion.button>
          ))}
        </div>

        {/* Facility Filter Input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search facilities..."
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-border bg-surface-interactive text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground transition-all duration-200"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-2xl bg-surface-raised animate-pulse border border-border" />
          ))
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No matches found</h3>
            <p className="text-sm text-muted-foreground">
          {(levelFilter !== "All" && facilityFilter.trim() !== "")
            ? `No ${levelFilter.toLowerCase()} matches at facilities matching "${facilityFilter}"`
            : (levelFilter !== "All")
              ? `No ${levelFilter.toLowerCase()} matches available right now.`
              : (facilityFilter.trim() !== "")
                ? `No matches at facilities matching "${facilityFilter}"`
                : "No open play matches available right now."}
        </p>
            {(levelFilter !== "All" || facilityFilter.trim() !== "") && (
              <button onClick={() => {
                setLevelFilter("All");
                setFacilityFilter("");
              }} className="mt-6 text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer">
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((m: MatchData, i: number) => {
              const rawMatch = m as any;
              const cardData = {
                id: m.id,
                level: m.level,
                slots: rawMatch.participants || m.current_players || 0,
                max: rawMatch.max_participants || m.max_players || 0,
                facility: rawMatch.facility || m.facility_name,
                location: m.location || rawMatch.location || "BGC, Taguig",
                date: m.date,
                time: m.time,
                host: m.host || "Picklers Organizer",
                price: m.price
              };
              return (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04, ease: "easeOut" }}>
                <LockedFeatureWrapper featureLabel="join open play sessions" showLockIcon={true}>
                  <MatchCard m={cardData} joined={joined.has(m.id)} onJoin={() => {
                    if (joined.has(m.id)) return;
                    setJoined(prev => new Set(prev).add(m.id));
                    setNotifications(prev => [
                      {
                        id: `notif-op-${Date.now()}`,
                        title: "Joined Open Play!",
                        body: `You joined '${m.type || "Doubles Open Play"}' at ${m.facility_name || "BGC Pickleball Hub"} on ${m.date}.`,
                        time: "Just now",
                        read: false,
                        type: "booking"
                      },
                      ...prev
                    ]);
                    setBookings(prev => {
                      const newBooking: Booking = {
                        id: `PKL-OP-${m.id}${Date.now().toString().slice(-3)}`,
                        facility_id: 0, // placeholder
                        court_name: `Open Play • ${m.level}`,
                        court: `Open Play • ${m.level}`,
                        facility: m.facility_name || "Unknown Facility",
                        date: m.date,
                        time: m.time,
                        duration: "2h",
                        price: m.price,
                        total: m.price,
                        status: "upcoming",
                        payment: "Pay at Venue",
                        players: [],
                        isNew: true // For animation
                      };
                      return [newBooking, ...prev];
                    });
                  }} />
                </LockedFeatureWrapper>
              </motion.div>
              );
            })}
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
