import { useState } from "react";
import { motion } from "motion/react";
import {
  MapPin, Star, Clock, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FACILITIES } from "@/data/mockData";


export function FacilityCard({ f, onFav, onViewCourts }: { f: typeof FACILITIES[0]; onFav: () => void; onViewCourts?: () => void }) {
  const [fav, setFav] = useState(f.favorited);
  const [pop, setPop] = useState(false);
  function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    setFav(v => !v);
    setPop(true);
    setTimeout(() => setPop(false), 300);
    onFav();
  }
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card flex flex-col group"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(0,212,255,0.06) inset" }}>
      <div className="relative overflow-hidden h-44 bg-secondary">
        <img src={f.image} alt={f.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium bg-black/50 backdrop-blur-sm text-white border border-white/20">
          {f.type}
        </span>
        <motion.button onClick={handleFav} aria-label={fav ? "Remove favorite" : "Add to favorites"}
          animate={pop ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-2 right-2 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/70"
          style={{ transition: "background-color 150ms ease-out" }}>
          <Heart className={cn("w-4 h-4", fav ? "fill-red-500 text-red-500" : "text-white")}
            style={{ transition: "color 150ms ease-out, fill 150ms ease-out" }} />
        </motion.button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-foreground leading-tight text-sm">{f.name}</div>
          <div className="flex items-center gap-1 text-amber-400 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-xs font-mono">{f.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="w-3 h-3 shrink-0" /><span>{f.location}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">🏍 {f.moto} · 🚗 {f.car} · {f.distance}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" /><span>{f.hours}</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <span className="text-cyan-400 font-bold font-mono text-sm">₱{f.price}<span className="text-muted-foreground font-normal">/hr</span></span>
          <button onClick={onViewCourts}
            className="text-xs px-4 py-2.5 rounded-lg font-medium active:scale-[0.97]"
            style={{ background: "#22c55e", color: "#fff", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            View Courts
          </button>
        </div>
      </div>
    </div>
  );
}
