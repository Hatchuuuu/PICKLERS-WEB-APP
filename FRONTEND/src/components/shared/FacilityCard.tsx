import { useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  MapPin, Star, Clock, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FACILITIES, FACILITY_COURTS } from "@/data/mockData";


export function FacilityCard({ f, onFav, onViewCourts }: { f: typeof FACILITIES[0]; onFav: () => void; onViewCourts?: () => void }) {
  const [pop, setPop] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Deterministic mock density
  const density = (f.id * 37) % 100;
  const densityColor = density < 40 ? "var(--accent-success)" : density < 75 ? "var(--accent-warning)" : "var(--accent-danger)";

  const facilityCourts = FACILITY_COURTS[f.id] || [];
  const minPrice = facilityCourts.length > 0 ? Math.min(...facilityCourts.map(c => c.price)) : f.price;
  const maxPrice = facilityCourts.length > 0 ? Math.max(...facilityCourts.map(c => c.price)) : f.price;

  function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    setPop(true);
    setTimeout(() => setPop(false), 300);
    onFav();
  }

  return (
    <motion.div ref={ref}
      whileHover={{ y: -6, boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-[28px] overflow-hidden flex flex-col group relative cursor-pointer h-full bg-surface-raised border border-border shadow-md"
      onClick={onViewCourts}>

      {/* Flush Edge-to-Edge Image */}
      <div className="relative overflow-hidden h-[210px] w-full shrink-0">
        <img src={f.image} alt={f.name} className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <span className="absolute top-4 left-4 text-[11px] px-3.5 py-1.5 rounded-[8px] font-extrabold uppercase tracking-widest text-foreground shadow-sm border border-white/20"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          {f.type}
        </span>

        <motion.button onClick={handleFav} aria-label={f.favorited ? "Remove favorite" : "Add to favorites"}
          animate={pop ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-md"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.45)"}>
          <Heart className={cn("w-4 h-4 transition-colors", f.favorited ? "fill-red-500 text-red-500" : "text-foreground")} />
        </motion.button>
      </div>

      {/* Classic iOS Content Area */}
      <div className="flex flex-col flex-1 p-5 bg-transparent">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-semibold tracking-tight leading-tight text-[18px] xl:text-[20px] text-foreground line-clamp-1" title={f.name}>
            {f.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <Star className="w-4 h-4 fill-[#ff9f0a] text-[#ff9f0a]" />
            <span className="text-[14px] font-semibold text-foreground">{f.rating}</span>
          </div>
        </div>

        <div className="space-y-2 mt-2 mb-6">
          <div className="flex items-center gap-2 text-[13px] xl:text-[14px] text-foreground/60 font-medium truncate">
            <MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{f.location}</span>
          </div>
          <div className="flex items-center justify-between text-[13px] xl:text-[14px] text-foreground/60 font-medium gap-3">
            <div className="flex items-center gap-2 truncate">
              <Clock className="w-4 h-4 shrink-0" /><span className="truncate">{f.hours}</span>
            </div>
            <span className="text-[12px] shrink-0 whitespace-nowrap opacity-80">🏍 {f.moto} · 🚗 {f.car}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-foreground/50 uppercase tracking-widest mb-0.5 shrink-0">Court Fee</span>
            <span className="font-semibold text-[17px] xl:text-[21px] tracking-tight leading-none flex items-baseline gap-1 truncate"
              style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
              <span className="text-foreground truncate">
                {minPrice === maxPrice ? `₱${minPrice}` : `₱${minPrice} - ₱${maxPrice}`}
              </span>
              <span className="font-medium text-[12px] xl:text-[14px] text-foreground/50 shrink-0">/hr</span>
            </span>
          </div>
          <div
            className="text-[13px] xl:text-[14px] px-4 xl:px-5 py-2 xl:py-2.5 rounded-[10px] font-semibold whitespace-nowrap shrink-0 active:scale-[0.96] transition-all flex items-center justify-center"
            style={{ background: "var(--accent-primary)", color: "#080f2e", boxShadow: "0 4px 12px rgba(0,212,255,0.2)" }}>
            View Courts
          </div>
        </div>
      </div>
    </motion.div>
  );
}
