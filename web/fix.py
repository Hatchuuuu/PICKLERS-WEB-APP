import sys

with open('src/app/(player)/app/community/page.tsx', 'r') as f:
    lines = f.readlines()
start_index = 0
for i, line in enumerate(lines):
    if '<AnimatePresence mode="wait">' in line:
        start_index = i
        break

header = """\"use client\";

import { useState, useEffect, useRef } from \"react\";
import { motion, AnimatePresence } from \"motion/react\";
import { Heart, Search, Users, MessageCircle, Send, ChevronLeft, X, Medal } from \"lucide-react\";

import { useApp } from \"@/contexts/AppContext\";

export default function CommunityTab() {
  const [search, setSearch] = useState(\"\");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { 
    chatMessages: messages, 
    setChatMessages: setMessages, 
    likedPlayers: liked, 
    setLikedPlayers: setLiked, 
    playerLikes: likes, 
    setPlayerLikes: setLikes,
    players,
    setPlayers
  } = useApp();
  const [chatOpen, setChatOpen] = useState<string | number | null>(null);

  const [draft, setDraft] = useState(\"\");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Phase 2: Real-Time WebSocket Flood Simulation ---
    const interval = setInterval(() => {
      setPlayers(prev => {
        if (prev.length > 8) return prev; // cap growth
        const newId = Date.now();
        return [
          { id: newId, name: `Live Player ${newId.toString().slice(-4)}`, level: "3.5", gold: 0, silver: 0, bronze: 1, online: true },
          ...prev
        ];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const chatPlayer = players.find(p => p.id === chatOpen);

  function toggleLike(id: string | number) {
    const isLiked = liked.has(id);
    setLiked(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + (isLiked ? -1 : 1) }));
  }

  function sendMessage() {
    if (!draft.trim() || chatOpen === null) return;
    const now = new Date();
    const ts = now.toLocaleTimeString(\"en-PH\", { hour: \"numeric\", minute: \"2-digit\" });
    setMessages(prev => ({
      ...prev,
      [chatOpen]: [...(prev[chatOpen] || []), { from: \"me\", text: draft.trim(), ts }],
    }));
    setDraft(\"\");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: \"smooth\" }), 50);
  }

  useEffect(() => {
    if (chatOpen !== null) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: \"smooth\" }), 80);
    }
  }, [chatOpen]);

  const thread = chatOpen !== null ? messages[chatOpen] || [] : [];

  return (
"""

with open('src/app/(player)/app/community/page.tsx', 'w') as f:
    f.write(header)
    f.writelines(lines[start_index+1:])
print('Fixed community/page.tsx')
