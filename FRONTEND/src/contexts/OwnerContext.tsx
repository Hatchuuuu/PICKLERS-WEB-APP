import { createContext, useContext, useState, ReactNode } from "react";

type OwnerCourt = {
  id: number;
  name: string;
  surface: string;
  price: number;
  available: boolean;
};

type OwnerContextType = {
  ownerCourts: OwnerCourt[];
  setOwnerCourts: React.Dispatch<React.SetStateAction<OwnerCourt[]>>;
  addCourt: (court: OwnerCourt) => void;
  updateCourt: (id: number, updates: Partial<OwnerCourt>) => void;
};

const INITIAL_OWNER_COURTS: OwnerCourt[] = [
  { id: 1, name: "Court 1", surface: "Indoor · Hard", price: 400, available: true },
  { id: 2, name: "Court 2", surface: "Indoor · Hard", price: 400, available: true },
  { id: 3, name: "Court 3", surface: "Indoor · Cushioned", price: 450, available: false },
  { id: 4, name: "Center Court", surface: "Indoor · Premium", price: 600, available: true },
  { id: 5, name: "Court 5", surface: "Outdoor · Concrete", price: 300, available: false },
  { id: 6, name: "Court 6", surface: "Outdoor · Concrete", price: 300, available: true },
];

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [ownerCourts, setOwnerCourts] = useState<OwnerCourt[]>(INITIAL_OWNER_COURTS);

  const addCourt = (court: OwnerCourt) => {
    setOwnerCourts((prev) => [...prev, court]);
  };

  const updateCourt = (id: number, updates: Partial<OwnerCourt>) => {
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
