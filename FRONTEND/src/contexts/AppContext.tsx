import { createContext, useContext, useState, ReactNode } from "react";
import { FACILITIES, FACILITY_COURTS, LIVE_COURTS, BOOKING_REQUESTS, BOOKINGS, MOCK_CHATS, ChatMessage } from "@/data/mockData";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "booking" | "community" | "system";
};

export interface PlayerProfile {
  id: number;
  name: string;
  level: string;
  gold: number;
  silver: number;
  bronze: number;
  online: boolean;
}

const INITIAL_PLAYERS: PlayerProfile[] = [
  { id: 1, name: "Juan Dela Cruz", level: "4.0+", gold: 4, silver: 1, bronze: 7, online: true },
  { id: 2, name: "Ana Reyes", level: "3.5", gold: 2, silver: 3, bronze: 5, online: true },
  { id: 3, name: "Carlo Mendoza", level: "3.0", gold: 0, silver: 2, bronze: 8, online: false },
  { id: 4, name: "Grace Villanueva", level: "3.5", gold: 1, silver: 4, bronze: 3, online: true },
  { id: 5, name: "Bennie Alcantara", level: "4.0+", gold: 6, silver: 2, bronze: 9, online: false },
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Booking Confirmed", body: "Your booking at SM Southmall is confirmed for tomorrow at 10:00 AM.", time: "2m ago", read: false, type: "booking" },
  { id: "n2", title: "New Message", body: "Juan Dela Cruz invited you to play an Open Match.", time: "1h ago", read: false, type: "community" },
  { id: "n3", title: "Maintenance", body: "System maintenance scheduled for Sunday 2:00 AM.", time: "1d ago", read: true, type: "system" },
];

type AppContextType = {
  facilities: typeof FACILITIES;
  facilityCourts: typeof FACILITY_COURTS;
  bookings: typeof BOOKINGS;
  setBookings: React.Dispatch<React.SetStateAction<typeof BOOKINGS>>;
  joinedMatches: Set<number>;
  setJoinedMatches: React.Dispatch<React.SetStateAction<Set<number>>>;
  chatMessages: Record<number, ChatMessage[]>;
  setChatMessages: React.Dispatch<React.SetStateAction<Record<number, ChatMessage[]>>>;
  likedPlayers: Set<number>;
  setLikedPlayers: React.Dispatch<React.SetStateAction<Set<number>>>;
  playerLikes: Record<number, number>;
  setPlayerLikes: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  favoritedFacilities: Set<number>;
  setFavoritedFacilities: React.Dispatch<React.SetStateAction<Set<number>>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  players: PlayerProfile[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerProfile[]>>;
  awardMedals: (goldName: string, silverName: string, bronzeName: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState(BOOKINGS);
  const [joinedMatches, setJoinedMatches] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>(MOCK_CHATS);
  const [likedPlayers, setLikedPlayers] = useState<Set<number>>(new Set());
  const [playerLikes, setPlayerLikes] = useState<Record<number, number>>({ 1: 12, 2: 8, 3: 3, 4: 17, 5: 24 });
  const [favoritedFacilities, setFavoritedFacilities] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [players, setPlayers] = useState<PlayerProfile[]>(INITIAL_PLAYERS);

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
        facilities: FACILITIES,
        facilityCourts: FACILITY_COURTS,
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
        awardMedals
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
