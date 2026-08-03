import { memo, useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  MapPin, Star, Clock, Heart, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Facility } from "@/types";

function FacilityCardInner({ f, onFav, onViewCourts }: { f: Facility & { favorited?: boolean }; onFav: () => void; onViewCourts?: () => void }) {
  const [pop, setPop] = useState(false);
  const ref = useRef(null);
  useInView(ref, { once: true, margin: "-50px" });

  // Deterministic mock density
  // densityColor removed

  const minPrice = (f as any).min_price ?? f.price;
  const maxPrice = (f as any).max_price ?? f.price;

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
      className="rounded-[28px] overflow-hidden flex flex-col group relative cursor-pointer h-full border backdrop-blur-[20px] transition-all duration-300 bg-surface-base border-border shadow-lg dark:bg-gradient-to-br dark:from-white/[0.07] dark:to-white/[0.02] dark:border-white/[0.1] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      onClick={onViewCourts}>

      {/* Flush Edge-to-Edge Image */}
      <div className="relative overflow-hidden h-[170px] w-full shrink-0">
        <img src={f.image} alt={f.name} className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <span className="absolute top-4 left-4 text-[12px] px-3 py-1 rounded-full font-bold tracking-wide text-foreground shadow-sm border border-black/5 dark:border-white/20 bg-white/50 dark:bg-white/15 backdrop-blur-[12px]">
          {f.type}
        </span>

        <motion.button onClick={handleFav} aria-label={f.favorited ? "Remove favorite" : "Add to favorites"}
          animate={pop ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-md bg-white/50 hover:bg-white/70 dark:bg-black/45 dark:hover:bg-black/60 backdrop-blur-[8px]">
          <Heart className={cn("w-4 h-4 transition-colors", f.favorited ? "fill-red-500 text-red-500" : "text-foreground")} />
        </motion.button>
      </div>

      {/* Classic Content Area */}
      <div className="flex flex-col flex-1 p-4 bg-transparent font-sans">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-extrabold tracking-tight text-[15.5px] xl:text-[16.5px] text-foreground line-clamp-1" title={f.name}>
            {f.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-[11.5px] font-extrabold">{f.rating}</span>
          </div>
        </div>

        <div className="space-y-1.5 mt-0.5 mb-3.5">
          <div className="flex items-center gap-2 text-[12px] xl:text-[12.5px] font-semibold text-slate-200 dark:text-slate-200 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-cyan-400 stroke-[2.5]" />
            <span className="truncate">{f.location}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] xl:text-[12.5px] font-semibold gap-1.5 text-slate-200 dark:text-slate-200">
            <div className="flex items-center gap-2 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400 stroke-[2.5]" />
              <span className="truncate">{f.hours}</span>
            </div>
            <span className="text-[10.5px] shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-800/80 dark:bg-white/10 font-bold text-slate-200 border border-white/10 shadow-sm">
              🏍 {f.moto} · 🚗 {f.car}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto gap-2 pt-3 border-t border-white/10 dark:border-white/10">
          <div className="flex flex-col min-w-0">
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest mb-0.5 shrink-0 text-emerald-400 dark:text-emerald-400">
              COURT PRICE
            </span>
            <span className="font-extrabold text-[16px] xl:text-[17px] tracking-tight leading-none flex items-baseline gap-0.5 truncate text-foreground">
              <span className="truncate">
                {minPrice === maxPrice ? `₱${minPrice}` : `₱${minPrice} - ₱${maxPrice}`}
              </span>
              <span className="font-medium text-[11px] shrink-0 text-slate-400">/hr</span>
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewCourts?.();
            }}
            className="text-[12.5px] px-4 py-2 rounded-full font-extrabold tracking-wide whitespace-nowrap shrink-0 active:scale-95 transition-all flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_18px_rgba(16,185,129,0.4)] border border-emerald-400/40"
          >
            View Courts
            <ChevronRight className="w-3.5 h-3.5 text-white stroke-[3]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Custom comparison function for React.memo that ignores function props
function areEqual(prevProps: any, nextProps: any) {
  // Compare the facility object (assuming it's stable or we want to re-render if it changes)
  // For now, we'll do a shallow check on the facility id and other primitive properties
  if (prevProps.f.id !== nextProps.f.id) return false;
  if (prevProps.favorited !== nextProps.favorited) return false;

  // We're not comparing the function props as they may be recreated
  // In a real optimization, these should be wrapped in useCallback in the parent

  return true;
}

export const FacilityCard = memo(FacilityCardInner, areEqual);
export default FacilityCard;
