import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export type BlockedSlot = {
  id: string;
  date: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
};

export type OwnerCourt = {
  id: number;
  name: string;
  surface: string;
  price: number;
  available: boolean;
  blockedDates?: BlockedSlot[];
  currentBooking?: {
    userName: string;
    time: string;
  };
};

type OwnerContextType = {
  ownerCourts: OwnerCourt[];
  setOwnerCourts: React.Dispatch<React.SetStateAction<OwnerCourt[]>>;
  addCourt: (court: OwnerCourt) => Promise<void>;
  updateCourt: (id: number, updates: Partial<OwnerCourt>) => Promise<void>;
};

const INITIAL_OWNER_COURTS: OwnerCourt[] = [
  { id: 1, name: "Court 1", surface: "Indoor · Hard", price: 400, available: true, blockedDates: [] },
  { id: 2, name: "Court 2", surface: "Indoor · Hard", price: 400, available: false, blockedDates: [], currentBooking: { userName: "Juan Dela Cruz", time: "6:00 PM - 8:00 PM" } },
];

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [ownerCourts, setOwnerCourts] = useState<OwnerCourt[]>([]);
  const [facilityId, setFacilityId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchCourts() {
      if (!user) return;

      try {
        const { data: facilities, error: fError } = await supabase
          .from('facilities')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (fError) {
          console.error("Failed to fetch owner facilities:", fError);
          return;
        }

        if (facilities && facilities.length > 0) {
          const fId = facilities[0].id;
          if (mounted) setFacilityId(fId);
          
          const { data: dbCourts, error: cError } = await supabase
            .from('courts')
            .select('*')
            .eq('facility_id', fId);

          if (cError) {
            console.error("Failed to fetch owner courts:", cError);
            return;
          }

          if (dbCourts && mounted) {
            const mappedCourts: OwnerCourt[] = dbCourts.map(c => ({
              id: Number(c.id),
              name: String(c.name),
              surface: String(c.surface || "Standard"),
              price: Number(c.price || 0),
              available: c.status !== "maintenance",
              blockedDates: Array.isArray(c.blocked_dates) ? c.blocked_dates : []
            }));
            
            setOwnerCourts(mappedCourts.length > 0 ? mappedCourts : INITIAL_OWNER_COURTS);
          }
        } else if (mounted) {
          setOwnerCourts(INITIAL_OWNER_COURTS);
        }
      } catch (e) {
        console.error("Error fetching owner courts:", e);
      }
    }

    fetchCourts();

    return () => {
      mounted = false;
    };
  }, [user]);

  const addCourt = async (court: OwnerCourt) => {
    if (!facilityId) {
      console.error("No facility ID found to attach court to.");
      return;
    }

    const newCourt = {
      facility_id: facilityId,
      name: court.name,
      surface: court.surface,
      type: court.surface.toLowerCase().includes('indoor') ? 'Indoor' : 'Outdoor',
      price: court.price,
      status: court.available ? 'available' : 'maintenance',
      blocked_dates: court.blockedDates || []
    };

    const { data, error } = await supabase.from('courts').insert([newCourt]).select().single();
    if (error) {
      console.error("Failed to add court to Supabase:", error);
      throw error;
    }
    
    setOwnerCourts((prev) => [...prev, { ...court, id: data.id }]);
  };

  const updateCourt = async (id: number, updates: Partial<OwnerCourt>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.surface !== undefined) {
      dbUpdates.surface = updates.surface;
      dbUpdates.type = updates.surface.toLowerCase().includes('indoor') ? 'Indoor' : 'Outdoor';
    }
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.available !== undefined) dbUpdates.status = updates.available ? 'available' : 'maintenance';
    if (updates.blockedDates !== undefined) dbUpdates.blocked_dates = updates.blockedDates;

    const { error } = await supabase.from('courts').update(dbUpdates).eq('id', id);
    if (error) {
      console.error("Failed to update court in Supabase:", error);
      throw error;
    }

    setOwnerCourts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  return (
    <OwnerContext.Provider value={{ ownerCourts, setOwnerCourts, addCourt, updateCourt }}>
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error("useOwner must be used within an OwnerProvider");
  }
  return context;
}
