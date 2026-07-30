import { Facility, Booking, MatchData, FeedPost, CommunityPlayer } from "@/types";
import { AppNotification, PlayerProfile } from "@/contexts/AppContext";
import { OwnerCourt } from "@/contexts/OwnerContext";

// ─────────────────────────────────────────────────────────────────────────────
// PHILIPPINE LOCALIZED DEMO MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FACILITIES: Facility[] = [
  {
    id: 901,
    name: "BGC Pickleball Hub",
    address: "9th Ave cor 30th St, Bonifacio Global City, Taguig",
    location: "Bonifacio Global City, Taguig",
    type: "Indoor / Outdoor",
    rating: 4.9,
    reviews: 142,
    price: 450,
    hours: "6am - 11pm",
    distance: "1.2 km",
    moto: "5 min",
    car: "10 min",
    image: "https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["Pro Shop", "Locker Rooms", "Shower", "Parking", "Cafe", "WiFi"],
    rules: ["Non-marking court shoes required", "No food inside the playing area", "Respect booking time limits"],
    courts: 6,
    indoor: true,
    tags: ["Popular", "Tournament-Grade", "Air Conditioned"]
  },
  {
    id: 902,
    name: "Makati Sports & Pickleball Club",
    address: "LP Leviste St, Salcedo Village, Makati",
    location: "Salcedo Village, Makati",
    type: "Indoor · Premium Hard",
    rating: 4.8,
    reviews: 98,
    price: 500,
    hours: "7am - 10pm",
    distance: "3.4 km",
    moto: "12 min",
    car: "20 min",
    image: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["Air Conditioned", "Locker Rooms", "Cafe", "Valet Parking"],
    rules: ["Proper sports attire required", "Check-in 10 minutes prior to booking"],
    courts: 4,
    indoor: true,
    tags: ["Premium", "Indoor"]
  },
  {
    id: 903,
    name: "Ortigas Community Courts",
    address: "Julia Vargas Ave, Ortigas Center, Pasig",
    location: "Ortigas Center, Pasig",
    type: "Outdoor · Acrylic",
    rating: 4.7,
    reviews: 76,
    price: 350,
    hours: "6am - 10pm",
    distance: "5.1 km",
    moto: "18 min",
    car: "30 min",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["Floodlights", "Water Refill", "Bleachers"],
    rules: ["Court lights turn off promptly at 10 PM"],
    courts: 8,
    indoor: false,
    tags: ["Budget Friendly", "Outdoor", "Spacious"]
  },
  {
    id: 904,
    name: "Alabang Town Pickleball Arena",
    address: "Commerce Ave, Alabang, Muntinlupa",
    location: "Alabang, Muntinlupa",
    type: "Indoor · Cushion",
    rating: 4.9,
    reviews: 110,
    price: 450,
    hours: "6am - 11pm",
    distance: "14.2 km",
    moto: "25 min",
    car: "40 min",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["Pro Shop", "Shower", "Lounge", "Parking"],
    rules: ["Clean shoes only on cushion courts"],
    courts: 6,
    indoor: true,
    tags: ["Southern Hub", "Air Conditioned"]
  }
];

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: "PKL-DEMO-001",
    facility_id: 901,
    facility: "BGC Pickleball Hub",
    court: "Championship Court 1",
    court_name: "Championship Court 1",
    date: "Tomorrow",
    time: "6:00 PM - 8:00 PM",
    duration: "2 hours",
    price: 900,
    status: "upcoming",
    players: [
      { name: "Juan Dela Cruz", level: "3.5" },
      { name: "Maria Santos", level: "3.5" }
    ],
    total: 900,
    payment: "Pickle Credits"
  },
  {
    id: "PKL-DEMO-002",
    facility_id: 902,
    facility: "Makati Sports & Pickleball Club",
    court: "Indoor Court A",
    court_name: "Indoor Court A",
    date: "Saturday",
    time: "9:00 AM - 11:00 AM",
    duration: "2 hours",
    price: 1000,
    status: "upcoming",
    players: [
      { name: "Carlos Reyes", level: "4.0" }
    ],
    total: 1000,
    payment: "Pickle Credits"
  },
  {
    id: "PKL-DEMO-003",
    facility_id: 903,
    facility: "Ortigas Community Courts",
    court: "Court 4",
    court_name: "Court 4",
    date: "Yesterday",
    time: "7:00 PM - 8:00 PM",
    duration: "1 hour",
    price: 350,
    status: "completed",
    players: [],
    total: 350,
    payment: "Pickle Credits"
  },
  {
    id: "PKL-DEMO-004",
    facility_id: 901,
    facility: "BGC Pickleball Hub",
    court: "Court 3",
    court_name: "Court 3",
    date: "Last Sunday",
    time: "4:00 PM - 6:00 PM",
    duration: "2 hours",
    price: 900,
    status: "completed",
    players: [],
    total: 900,
    payment: "Pickle Credits"
  },
  {
    id: "PKL-DEMO-005",
    facility_id: 904,
    facility: "Alabang Town Pickleball Arena",
    court: "Court 2",
    court_name: "Court 2",
    date: "Jul 20, 2026",
    time: "3:00 PM - 5:00 PM",
    duration: "2 hours",
    price: 900,
    status: "cancelled",
    players: [],
    total: 900,
    payment: "Pickle Credits"
  }
];

export const DEMO_MATCHES: MatchData[] = [
  {
    id: 801,
    facility_name: "BGC Pickleball Hub",
    location: "Bonifacio Global City, Taguig",
    date: "Tonight",
    time: "7:00 PM - 9:00 PM",
    level: "Intermediate (3.0 - 3.5)",
    current_players: 3,
    max_players: 4,
    price: 225,
    type: "Doubles Open Play",
    host: "Juan Dela Cruz"
  },
  {
    id: 802,
    facility_name: "Makati Sports & Pickleball Club",
    location: "Salcedo Village, Makati",
    date: "Tomorrow",
    time: "6:00 PM - 8:00 PM",
    level: "Advanced (4.0+)",
    current_players: 2,
    max_players: 4,
    price: 250,
    type: "Competitive Doubles",
    host: "Carlos Reyes"
  },
  {
    id: 803,
    facility_name: "Ortigas Community Courts",
    location: "Ortigas Center, Pasig",
    date: "Saturday",
    time: "8:00 AM - 11:00 AM",
    level: "Beginner (2.0 - 2.5)",
    current_players: 5,
    max_players: 8,
    price: 175,
    type: "Social Round Robin",
    host: "Maria Santos"
  },
  {
    id: 804,
    facility_name: "Alabang Town Pickleball Arena",
    location: "Alabang, Muntinlupa",
    date: "Sunday",
    time: "4:00 PM - 7:00 PM",
    level: "All Levels",
    current_players: 10,
    max_players: 12,
    price: 200,
    type: "Weekend King of the Court",
    host: "Bennie Ocampo"
  }
];

export const DEMO_PLAYERS: PlayerProfile[] = [
  { id: "demo_p1", name: "Juan Dela Cruz", level: "3.5", gold: 12, silver: 8, bronze: 5, online: true },
  { id: "demo_p2", name: "Maria Santos", level: "3.5", gold: 15, silver: 4, bronze: 9, online: true },
  { id: "demo_p3", name: "Carlos Reyes", level: "4.5", gold: 28, silver: 12, bronze: 6, online: false },
  { id: "demo_p4", name: "Liza Soberano", level: "3.0", gold: 7, silver: 11, bronze: 8, online: true },
  { id: "demo_p5", name: "Paolo Avelino", level: "4.0", gold: 19, silver: 14, bronze: 10, online: false },
  { id: "demo_p6", name: "Bea Alonzo", level: "2.5", gold: 3, silver: 6, bronze: 12, online: true },
  { id: "demo_p7", name: "Dingdong Dantes", level: "4.0", gold: 21, silver: 9, bronze: 7, online: false },
  { id: "demo_p8", name: "Anne Curtis", level: "3.0", gold: 8, silver: 15, bronze: 9, online: true }
];

export const DEMO_COMMUNITY_PLAYERS: CommunityPlayer[] = DEMO_PLAYERS.map((p, idx) => ({
  id: String(p.id),
  name: p.name,
  level: p.level,
  gold: p.gold,
  silver: p.silver,
  bronze: p.bronze,
  online: p.online,
  like_count: 10 + idx * 4,
  i_liked: idx % 2 === 0
}));

export const DEMO_FEED_POSTS: FeedPost[] = [
  {
    id: "demo_post_1",
    author_id: "demo_p3",
    author_name: "Carlos Reyes",
    author_level: "4.5",
    content: "Amazing tournament finals at BGC Pickleball Hub today! Huge shoutout to everyone who competed. The level of pickleball in Metro Manila is growing so fast! 🏓🔥",
    image_url: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=1000&auto=format&fit=crop",
    like_count: 48,
    comment_count: 12,
    i_liked: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    recent_comments: [
      {
        id: "c1",
        post_id: "demo_post_1",
        author_id: "demo_p1",
        author_name: "Juan Dela Cruz",
        content: "What a match, Carlos! That ATP shot on match point was unbelievable!",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },
  {
    id: "demo_post_2",
    author_id: "demo_p2",
    author_name: "Maria Santos",
    author_level: "3.5",
    content: "Looking for a 4th player for our doubles game tomorrow at Makati Sports Club, 6 PM! Intermediate 3.5 level. Drop a message or join via Open Play! 👋",
    image_url: null,
    like_count: 19,
    comment_count: 5,
    i_liked: false,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: "demo_post_3",
    author_id: "demo_p5",
    author_name: "Paolo Avelino",
    author_level: "4.0",
    content: "New carbon fiber paddle test run at Ortigas Community Courts. Love the control and spin on kitchen dinks!",
    image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1000&auto=format&fit=crop",
    like_count: 34,
    comment_count: 8,
    i_liked: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "demo_notif_1",
    title: "Court Booking Confirmed!",
    body: "Your booking for Championship Court 1 at BGC Pickleball Hub is scheduled for tomorrow at 6:00 PM.",
    time: "2h ago",
    read: false,
    type: "booking"
  },
  {
    id: "demo_notif_2",
    title: "Match Invite",
    body: "Maria Santos invited you to join 'Doubles Open Play' at Makati Sports & Pickleball Club.",
    time: "5h ago",
    read: false,
    type: "community"
  },
  {
    id: "demo_notif_3",
    title: "Pickle Credits Credited",
    body: "₱1,000 Pickle Credits have been added to your wallet.",
    time: "1d ago",
    read: true,
    type: "system"
  }
];

export const DEMO_WALLET_TRANSACTIONS = [
  {
    id: "demo_tx_1",
    type: "booking",
    title: "Court Booking - BGC Pickleball Hub",
    date: "Today, 2:15 PM",
    amount: -900,
    status: "completed"
  },
  {
    id: "demo_tx_2",
    type: "topup",
    title: "Wallet Top Up via GCash",
    date: "Yesterday, 10:30 AM",
    amount: 1500,
    status: "completed"
  },
  {
    id: "demo_tx_3",
    type: "booking",
    title: "Court Booking - Ortigas Community Courts",
    date: "Jul 27, 2026",
    amount: -350,
    status: "completed"
  },
  {
    id: "demo_tx_4",
    type: "refund",
    title: "Booking Refund - Alabang Town Arena",
    date: "Jul 20, 2026",
    amount: 900,
    status: "completed"
  }
];

export const DEMO_OWNER_COURTS: OwnerCourt[] = [
  {
    id: 101,
    name: "Championship Court 1",
    surface: "Indoor · Premium Hard",
    price: 450,
    available: false,
    blockedDates: [],
    currentBooking: {
      userName: "Juan Dela Cruz",
      time: "6:00 PM - 8:00 PM"
    }
  },
  {
    id: 102,
    name: "Indoor Court 2",
    surface: "Indoor · Premium Hard",
    price: 450,
    available: true,
    blockedDates: []
  },
  {
    id: 103,
    name: "Indoor Court 3",
    surface: "Indoor · Premium Hard",
    price: 450,
    available: false,
    blockedDates: [],
    currentBooking: {
      userName: "Carlos Reyes",
      time: "5:00 PM - 7:00 PM"
    }
  },
  {
    id: 104,
    name: "Outdoor Court A",
    surface: "Outdoor · Acrylic",
    price: 350,
    available: true,
    blockedDates: []
  },
  {
    id: 105,
    name: "Outdoor Court B",
    surface: "Outdoor · Acrylic",
    price: 350,
    available: true,
    blockedDates: []
  },
  {
    id: 106,
    name: "Outdoor Court C",
    surface: "Outdoor · Acrylic",
    price: 350,
    available: false,
    blockedDates: []
  }
];
