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

// ---- Community Types ----

export type Club = {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  admin_id: string;
  admin_name?: string;
  member_count: number;
  my_status: "none" | "pending" | "member" | "admin";
  created_at: string;
};

export type ClubMember = {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  level?: string;
  status: "pending" | "member" | "admin";
  joined_at: string;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export type Conversation = {
  user_id: string;
  name: string;
  avatar_url?: string;
  level?: string;
  online: boolean;
  last_message: string;
  last_at: string;
  unread_count: number;
};

export type CommunityPlayer = {
  id: string;
  name: string;
  avatar_url?: string;
  level: string;
  gold: number;
  silver: number;
  bronze: number;
  online: boolean;
  like_count: number;
  i_liked: boolean;
};

export type FeedPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url?: string | null;
  author_level?: string;
  content: string | null;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  i_liked: boolean;
  created_at: string;
  recent_comments?: FeedComment[];
};

export type FeedComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url?: string | null;
  content: string;
  created_at: string;
};
