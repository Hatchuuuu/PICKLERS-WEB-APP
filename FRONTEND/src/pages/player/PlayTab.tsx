import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Search
} from "lucide-react";
import { FACILITIES } from "@/data/mockData";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { FacilityDetailView } from "@/pages/player/FacilityDetailView";


export function PlayTab() {
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<typeof FACILITIES[0] | null>(null);

  const filtered = FACILITIES.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {selectedFacility ? (
        <FacilityDetailView
          key="detail"
          facility={selectedFacility}
          onBack={() => setSelectedFacility(null)}
        />
      ) : (
        <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
          transition={{ ease: "easeOut", duration: 0.2 }}
          className="p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>DISCOVER COURTS</h1>
              <p className="text-sm text-muted-foreground">Find and book the best facilities near you</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl hover:bg-secondary hidden sm:flex"
              style={{ border: "1px solid rgba(0,212,255,0.15)", color: "#a0b4e0", transition: "background-color 150ms ease-out" }}>
              <MapPin className="w-3.5 h-3.5" />Metro Manila
            </button>
          </div>
          <div className="relative mb-6 mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search facilities or locations..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring"
              style={{ background: "rgba(26,45,110,0.4)", border: "1px solid rgba(0,212,255,0.12)", color: "#e8eeff", transition: "border-color 150ms ease-out" }} />
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium text-foreground mb-1">No facilities found</p>
              <p className="text-xs">Try a different city or facility name</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease: "easeOut" }}>
                  <FacilityCard f={f} onFav={() => {}} onViewCourts={() => setSelectedFacility(f)} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
