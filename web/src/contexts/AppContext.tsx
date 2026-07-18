"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { ChatMessage, Facility, Booking, CourtData } from "@/types";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "booking" | "community" | "system";
};

export interface PlayerProfile {
  id: string | number;
  name: string;
  level: string;
  gold: number;
  silver: number;
  bronze: number;
  online: boolean;
}





type AppContextType = {
  facilities: Facility[];
  facilityCourts: CourtData[];
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  joinedMatches: Set<number>;
  setJoinedMatches: React.Dispatch<React.SetStateAction<Set<number>>>;
  chatMessages: Record<string | number, ChatMessage[]>;
  setChatMessages: React.Dispatch<React.SetStateAction<Record<string | number, ChatMessage[]>>>;
  likedPlayers: Set<string | number>;
  setLikedPlayers: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  playerLikes: Record<string | number, number>;
  setPlayerLikes: React.Dispatch<React.SetStateAction<Record<string | number, number>>>;
  favoritedFacilities: Set<number>;
  setFavoritedFacilities: React.Dispatch<React.SetStateAction<Set<number>>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  players: PlayerProfile[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerProfile[]>>;
  awardMedals: (goldName: string, silverName: string, bronzeName: string) => void;
  isDataLoaded: boolean;
  hasError: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

import { useToast } from "./ToastContext";

export function AppProvider({ children }: { children: ReactNode }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { showToast } = useToast();
  
  const [joinedMatches, setJoinedMatches] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<Record<string | number, ChatMessage[]>>({});
  const [likedPlayers, setLikedPlayers] = useState<Set<string | number>>(new Set());
  const [playerLikes, setPlayerLikes] = useState<Record<string | number, number>>({ 1: 12, 2: 8, 3: 3, 4: 17, 5: 24 });
  const [favoritedFacilities, setFavoritedFacilities] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);

  // Fetch real data from Supabase
  useEffect(() => {
    let mounted = true;

    async function fetchCoreData() {
      try {
        const { data: dbFacilities, error: fError } = await supabase.from('facilities').select('*');
        if (dbFacilities && !fError && mounted) {
          const mappedFacilities = dbFacilities.map((f: Record<string, unknown>) => ({
            id: Number(f.id),
            name: String(f.name),
            address: String(f.location || "Unknown Location"),
            location: String(f.location || "Unknown Location"),
            type: String(f.type || "Outdoor"),
            image: String(f.image || "https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop"),
            distance: String(f.distance || "2.5 km"),
            moto: String(f.moto || "15 min"),
            car: String(f.car || "30 min"),
            hours: String(f.hours || "6am - 10pm"),
            courts: 6,
            rating: Number(f.rating || 4.8),
            reviews: 124,
            price: f.price ? Number(f.price) : 400,
            indoor: String(f.type || "").toLowerCase().includes('indoor'),
            tags: []
          }));
          if (mappedFacilities.length > 0) {
             setFacilities(mappedFacilities);
          } else {
             setFacilities([]);
          }
        } else if (mounted) {
          setFacilities([]);
        }
        // Fetch Bookings
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const { data: dbBookings, error: bError } = await supabase.from('bookings').select('*, facilities(name)').eq('user_id', session.user.id);
          if (dbBookings && !bError && dbBookings.length > 0) {
             const mappedBookings = dbBookings.map((b: Record<string, unknown>) => ({
               id: String(b.id),
               facility_id: Number(b.facility_id || 1),
               facility: String((b.facilities as Record<string, unknown>)?.name || "Unknown Facility"),
               court: String(b.court_name),
               court_name: String(b.court_name),
               date: String(b.date),
               time: String(b.time),
               duration: String(b.duration),
               price: Number(b.price),
               status: String(b.status) as "upcoming" | "completed" | "cancelled",
               players: []
             }));
             setBookings(mappedBookings);
          } else {
             setBookings([]);
          }
        } else if (mounted) {
           setBookings([]);
        }

        // Fetch Real Players
        const { data: dbPlayers, error: pError } = await supabase.from('player_profiles').select('*');
        if (dbPlayers && !pError && mounted) {
           const mappedPlayers = dbPlayers.map((p: Record<string, unknown>) => ({
             id: String(p.id),
             name: String(p.name),
             level: String(p.level || "2.5"),
             gold: Number(p.gold_medals || 0),
             silver: Number(p.silver_medals || 0),
             bronze: Number(p.bronze_medals || 0),
             online: Boolean(p.online || false)
           }));
           setPlayers(mappedPlayers);
        }
      } catch (err) {
        console.error("Failed to fetch core data from Supabase", err);
        setFacilities([]);
        setBookings([]);
        if (mounted) {
          setHasError(true);
          showToast("Failed to load some data. Please check your connection.", "error");
        }
      } finally {
        if (mounted) setIsDataLoaded(true);
      }
    }

    fetchCoreData();

    // Subscribe to booking changes
    const bookingSub = supabase.channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchCoreData(); // Refresh bookings dynamically
      })
      .subscribe();

    return () => { 
      mounted = false;
      bookingSub.unsubscribe(); 
    };
  }, []);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const awardMedals = (goldName: string, silverName: string, bronzeName: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.name === goldName) return { ...p, gold: p.gold + 1 };
      if (p.name === silverName) return { ...p, silver: p.silver + 1 };
      if (p.name === bronzeName) return { ...p, bronze: p.bronze + 1 };
      return p;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        facilities,
        facilityCourts: [],
        bookings,
        setBookings,
        joinedMatches,
        setJoinedMatches,
        chatMessages,
        setChatMessages,
        likedPlayers,
        setLikedPlayers,
        playerLikes,
        setPlayerLikes,
        favoritedFacilities,
        setFavoritedFacilities,
        notifications,
        setNotifications,
        markAllNotificationsRead,
        dismissNotification,
        players,
        setPlayers,
        awardMedals,
        isDataLoaded,
        hasError
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
