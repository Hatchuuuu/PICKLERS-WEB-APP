export type ChatMessage = { from: "me" | "them"; text: string; ts: string };

export type CourtData = {
  id: string | number;
  name: string;
  surface?: string;
  type: "Indoor" | "Outdoor" | "Indoor/Outdoor";
  price: number;
  image?: string;
  status?: "available" | "maintenance" | "occupied";
  occupiedUntil?: string;
  occupiedBy?: string;
};

export type Facility = {
  id: number;
  name: string;
  address?: string;
  location: string;
  type: string;
  rating: number;
  reviews: number;
  price: number | string;
  hours?: string;
  distance: string;
  moto?: string;
  car?: string;
  image: string;
  images?: string[];
  amenities?: string[];
  rules?: string[];
  availableDates?: string[];
  courts?: number;
  indoor?: boolean;
  tags?: string[];
};

export type Player = {
  name: string;
  image?: string;
  rating?: number;
  level?: string;
  [key: string]: unknown;
};

export type Booking = {
  id: string;
  facility_id: number;
  facility: string;
  court: string;
  court_name: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: "upcoming" | "completed" | "cancelled";
  players: Player[];
  isNew?: boolean;
  total?: number;
  payment?: string;
};

export type MatchData = {
  id: number;
  facility_name: string;
  location: string;
  date: string;
  time: string;
  level: string;
  current_players: number;
  max_players: number;
  price: number;
  type: string;
  host?: string;
};

export type PaymentData = {
  court: CourtData;
  facility: Facility;
  date: string | Date;
  startTime: string;
  endTime: string;
};

export type LiveCourt = {
  id: number;
  name: string;
  status: string;
  player: string | null;
  remaining: number;
  maxTime: number;
};
