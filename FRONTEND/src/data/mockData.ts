export type ChatMessage = { from: "me" | "them"; text: string; ts: string };

export const MOCK_CHATS: Record<number, ChatMessage[]> = {
  1: [
    { from: "them", text: "Hey! Good game yesterday 🏓", ts: "2:14 PM" },
    { from: "me", text: "Thanks! Your backhand is insane haha", ts: "2:15 PM" },
    { from: "them", text: "Rematch this Saturday?", ts: "2:16 PM" },
  ],
  2: [
    { from: "them", text: "Are you joining the BGC open play?", ts: "Yesterday" },
    { from: "me", text: "Yes! Booked Court 2 at 7AM", ts: "Yesterday" },
  ],
  3: [],
  4: [
    { from: "them", text: "Hi! Looking for a doubles partner 🤝", ts: "Mon" },
  ],
  5: [
    { from: "them", text: "Congrats on the tournament win!", ts: "Last week" },
    { from: "me", text: "Thank you! You should join next time", ts: "Last week" },
  ],
};

export const FACILITIES = [
  {
    id: 1,
    name: "SM Southmall Picklepark",
    location: "Las Piñas City",
    type: "Indoor",
    rating: 4.9,
    price: 500,
    hours: "6:00 AM – 10:00 PM",
    distance: "2.1 km",
    moto: "8 min",
    car: "15 min",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format",
    favorited: false,
  },
  {
    id: 2,
    name: "BGC Pickleball Hub",
    location: "Bonifacio Global City, Taguig",
    type: "Outdoor",
    rating: 4.8,
    price: 400,
    hours: "5:00 AM – 11:00 PM",
    distance: "5.4 km",
    moto: "18 min",
    car: "30 min",
    image: "https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format",
    favorited: true,
  },
  {
    id: 3,
    name: "Ayala Center Cebu Courts",
    location: "Cebu City, Cebu",
    type: "Indoor/Outdoor",
    rating: 4.7,
    price: 350,
    hours: "7:00 AM – 9:00 PM",
    distance: "1.2 km",
    moto: "5 min",
    car: "10 min",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format",
    favorited: false,
  },
  {
    id: 4,
    name: "Robinsons Dumaguete Sports",
    location: "Dumaguete City, Negros Oriental",
    type: "Indoor",
    rating: 4.6,
    price: 300,
    hours: "8:00 AM – 8:00 PM",
    distance: "0.8 km",
    moto: "4 min",
    car: "7 min",
    image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=400&fit=crop&auto=format",
    favorited: false,
  },
  {
    id: 5,
    name: "Eastwood City Pickledome",
    location: "Libis, Quezon City",
    type: "Outdoor",
    rating: 4.5,
    price: 380,
    hours: "6:00 AM – 10:00 PM",
    distance: "7.3 km",
    moto: "22 min",
    car: "35 min",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&h=400&fit=crop&auto=format",
    favorited: false,
  },
  {
    id: 6,
    name: "Iloilo Sports Complex",
    location: "Iloilo City",
    type: "Indoor",
    rating: 4.8,
    price: 320,
    hours: "7:00 AM – 10:00 PM",
    distance: "3.1 km",
    moto: "12 min",
    car: "18 min",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format",
    favorited: false,
  },
];

export const OPEN_MATCHES = [
  { id: 1, level: "Beginner", facility: "BGC Pickleball Hub", date: "Jul 8, 2026", time: "8:00 AM – 10:00 AM", slots: 5, max: 8, host: "Maria Santos", price: 200 },
  { id: 2, level: "Intermediate", facility: "SM Southmall Picklepark", date: "Jul 8, 2026", time: "10:00 AM – 12:00 PM", slots: 3, max: 6, host: "Juan Dela Cruz", price: 280 },
  { id: 3, level: "Advanced", facility: "Ayala Center Cebu Courts", date: "Jul 9, 2026", time: "6:00 AM – 8:00 AM", slots: 1, max: 4, host: "Ana Reyes", price: 450 },
  { id: 4, level: "Beginner", facility: "Eastwood City Pickledome", date: "Jul 9, 2026", time: "3:00 PM – 5:00 PM", slots: 6, max: 8, host: "Carlo Mendoza", price: 190 },
];

export const BOOKINGS = [
  { id: "PKL-20260712", court: "Center Court (Premium)", facility: "BGC Pickleball Hub", date: "Jul 12, 2026", time: "6:00 PM – 8:00 PM", total: 1500, status: "upcoming", payment: "Credit Card" },
  { id: "PKL-20260715", court: "Court A (Outdoor)", facility: "Eastwood City Pickledome", date: "Jul 15, 2026", time: "7:00 AM – 9:00 AM", total: 760, status: "upcoming", payment: "GCash" },
  { id: "PKL-20260701", court: "Court 3 (Indoor)", facility: "SM Southmall Picklepark", date: "Jul 10, 2026", time: "10:00 AM – 12:00 PM", total: 1000, status: "upcoming", payment: "GCash" },
  { id: "PKL-20260628", court: "Center Court (Outdoor)", facility: "BGC Pickleball Hub", date: "Jun 28, 2026", time: "7:00 AM – 9:00 AM", total: 800, status: "completed", payment: "Pickle Credits" },
  { id: "PKL-20260615", court: "Court 1 (Indoor)", facility: "Iloilo Sports Complex", date: "Jun 15, 2026", time: "4:00 PM – 6:00 PM", total: 640, status: "completed", payment: "Cash on Site" },
  { id: "PKL-20260602", court: "Court 2 (Indoor)", facility: "Ayala Center Cebu Courts", date: "Jun 2, 2026", time: "9:00 AM – 11:00 AM", total: 700, status: "cancelled", payment: "GCash" },
];

export const LIVE_COURTS = [
  { id: 1, name: "Court 1", status: "occupied", player: "Juan D. / Maria S.", remaining: 2732, maxTime: 7200 },
  { id: 2, name: "Court 2", status: "occupied", player: "Carlos M. / Ana R.", remaining: 58, maxTime: 5400 },
  { id: 3, name: "Court 3", status: "available", player: null, remaining: 0, maxTime: 0 },
  { id: 4, name: "Center Court", status: "occupied", player: "Open Play (6 players)", remaining: 3600, maxTime: 5400 },
  { id: 5, name: "Court 5", status: "maintenance", player: null, remaining: 0, maxTime: 0 },
  { id: 6, name: "Court 6", status: "available", player: null, remaining: 0, maxTime: 0 },
];

export const BOOKING_REQUESTS = [
  { id: "R001", player: "Bennie Alcantara", court: "Court 1 (Indoor)", time: "10:00 AM – 1:00 PM", total: 960 },
  { id: "R002", player: "Grace Villanueva", court: "Center Court", time: "2:00 PM – 4:00 PM", total: 1280 },
  { id: "R003", player: "Marco Tan", court: "Court 3 (Indoor)", time: "4:00 PM – 6:00 PM", total: 640 },
];

export const FACILITY_COURTS: Record<number, Array<{
  id: number; name: string; surface: string; type: "Indoor" | "Outdoor"; price: number;
  status: "available" | "occupied" | "maintenance"; occupiedUntil?: string; occupiedBy?: string;
}>> = {
  1: [
    { id: 101, name: "Court 1", surface: "Hard Court", type: "Indoor", price: 500, status: "available" },
    { id: 102, name: "Court 2", surface: "Hard Court", type: "Indoor", price: 500, status: "occupied", occupiedUntil: "11:00 AM", occupiedBy: "Juan D." },
    { id: 103, name: "Court 3", surface: "Cushioned", type: "Indoor", price: 600, status: "available" },
    { id: 104, name: "Center Court", surface: "Premium Cushioned", type: "Indoor", price: 750, status: "maintenance" },
  ],
  2: [
    { id: 201, name: "Court A", surface: "Concrete", type: "Outdoor", price: 400, status: "available" },
    { id: 202, name: "Court B", surface: "Concrete", type: "Outdoor", price: 400, status: "occupied", occupiedUntil: "12:00 PM", occupiedBy: "Open Play" },
    { id: 203, name: "Court C", surface: "Asphalt", type: "Outdoor", price: 350, status: "available" },
  ],
  3: [
    { id: 301, name: "Court 1", surface: "Hard Court", type: "Indoor", price: 350, status: "occupied", occupiedUntil: "10:30 AM", occupiedBy: "Ana R." },
    { id: 302, name: "Court 2", surface: "Hard Court", type: "Indoor", price: 350, status: "available" },
    { id: 303, name: "Sunset Court", surface: "Cushioned", type: "Outdoor", price: 300, status: "available" },
  ],
  4: [
    { id: 401, name: "Court 1", surface: "Hard Court", type: "Indoor", price: 300, status: "available" },
    { id: 402, name: "Court 2", surface: "Hard Court", type: "Indoor", price: 300, status: "available" },
  ],
  5: [
    { id: 501, name: "Court A", surface: "Concrete", type: "Outdoor", price: 380, status: "maintenance" },
    { id: 502, name: "Court B", surface: "Concrete", type: "Outdoor", price: 380, status: "available" },
    { id: 503, name: "Court C", surface: "Asphalt", type: "Outdoor", price: 360, status: "occupied", occupiedUntil: "2:00 PM", occupiedBy: "Carlo M." },
  ],
  6: [
    { id: 601, name: "Court 1", surface: "Hard Court", type: "Indoor", price: 320, status: "available" },
    { id: 602, name: "Court 2", surface: "Hard Court", type: "Indoor", price: 320, status: "occupied", occupiedUntil: "11:30 AM", occupiedBy: "Grace V." },
    { id: 603, name: "Center Court", surface: "Premium", type: "Indoor", price: 450, status: "available" },
    { id: 604, name: "Court 4", surface: "Hard Court", type: "Indoor", price: 320, status: "available" },
  ],
};

export const TOURNAMENTS = [
  { id: 1, name: "Summer Smash 2026", format: "Single Elimination", division: "4.0+ Open", date: "Jul 20, 2026", teams: 14, maxTeams: 16, status: "active", prize: "₱50,000" },
  { id: 2, name: "Metro Manila Pickle Cup", format: "Round Robin", division: "3.0–3.5", date: "Aug 5, 2026", teams: 6, maxTeams: 12, status: "upcoming", prize: "₱20,000" },
  { id: 3, name: "BGC Open Classic", format: "Double Elimination", division: "Open", date: "May 15, 2026", teams: 16, maxTeams: 16, status: "completed", prize: "₱30,000" },
];
