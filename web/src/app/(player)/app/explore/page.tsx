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
  const [filter, setFilter] = useState("All");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { joinedMatches: joined, setJoinedMatches: setJoined, setBookings, setNotifications } = useApp();
  const { showToast } = useToast();
  const prevJoinedSize = useRef(joined.size);
  const { user } = useAuth();

  const { data: openMatches = [], isLoading } = useQuery({
    queryKey: ['matches', user?.id, filter],
    queryFn: async () => {
      let query = supabase.from('matches').select('*');

      // Apply filter at the database level when filter is not "All"
      if (filter !== "All") {
        query = query.eq('level', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const isDemo = user?.isDemo || user?.role === "demo";
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
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {levels.map(l => (
          <motion.button key={l} onClick={() => setFilter(l)}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              backgroundColor: filter === l ? "var(--accent-primary)" : (isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)"),
              color: filter === l ? "var(--surface-base)" : "var(--ink-secondary)",
              borderColor: filter === l ? "var(--accent-primary)" : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.1)"),
              boxShadow: filter === l ? "0 4px 12px rgba(0, 217, 139, 0.3)" : "0 0px 0px rgba(0,0,0,0)"
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide border border-solid relative overflow-hidden"
            style={{ backdropFilter: "blur(12px)" }}>
            {l}
          </motion.button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-[24px] bg-surface-raised animate-pulse border border-border" />
          ))
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-accent-primary/10 border border-accent-primary/20 shadow-[0_0_24px_rgba(0,217,139,0.15)]">
              <Trophy className="w-7 h-7 text-accent-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No matches found</h3>
            <p className="text-sm text-foreground/50">There are no {filter !== "All" ? filter.toLowerCase() : "open"} matches available right now.</p>
            {filter !== "All" && (
              <button onClick={() => setFilter("All")} className="mt-6 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                View all matches
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
