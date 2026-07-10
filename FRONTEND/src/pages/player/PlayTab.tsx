import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, X, SlidersHorizontal } from "lucide-react";
import { FACILITIES } from "@/data/mockData";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { FacilityDetailView } from "@/pages/player/FacilityDetailView";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApp } from "@/contexts/AppContext";

export function PlayTab() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { facilities, favoritedFacilities, setFavoritedFacilities } = useApp();
  const [selectedFacility, setSelectedFacility] = useState<typeof FACILITIES[0] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<"All" | "Indoor" | "Outdoor">("All");
  const [filterSort, setFilterSort] = useState<"Recommended" | "Price (Low to High)" | "Rating (High to Low)">("Recommended");

  useEffect(() => {
    // Simulate network latency for loading skeleton showcase
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = facilities
    .filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
    )
    .filter(f => filterType === "All" || f.type === filterType)
    .sort((a, b) => {
      if (filterSort === "Price (Low to High)") return a.price - b.price;
      if (filterSort === "Rating (High to Low)") return b.rating - a.rating;
      return 0; // Recommended
    });

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
          transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
          className="p-4 max-w-6xl mx-auto w-full">
          {toastMessage && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-black text-white shadow-lg text-sm font-medium">
              {toastMessage}
            </motion.div>
          )}
          <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
            <AnimatePresence>
              {!isSearching ? (
                <motion.div 
                  key="title" 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute left-0 top-0"
                >
                  <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
                    Discover Courts
                  </h1>
                  <p className="text-sm text-muted-foreground">Find and book the best facilities near you</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="search" 
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} 
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 right-[64px] top-0"
                >
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search courts, locations..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-[52px] pl-5 pr-12 rounded-[18px] outline-none font-medium text-[16px] transition-all shadow-sm focus:shadow-[0_0_20px_rgba(0,212,255,0.15)] focus:border-cyan-500/50"
                    style={{ 
                      background: "var(--surface-raised)", 
                      color: "var(--ink-primary)", 
                      border: "1px solid var(--border-subtle)" 
                    }}
                  />
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute -right-2 top-0 flex items-start gap-3">
              <AnimatePresence>
                {!isSearching && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="hidden sm:flex items-center h-[52px] gap-1.5 text-[14px] font-bold px-5 rounded-[18px] border border-solid select-none"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--ink-primary)", background: "var(--surface-interactive)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                    <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                    Metro Manila
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-col items-center gap-1 z-10">
                <motion.button 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    setIsSearching(!isSearching);
                    if (isSearching) setSearch("");
                  }}
                  className="w-[52px] h-[52px] flex items-center justify-center rounded-[18px] hover:bg-surface-raised transition-colors group relative" 
                  aria-label="Search"
                >
                  <AnimatePresence mode="popLayout">
                    {!isSearching ? (
                      <motion.div key="icon-search" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Search className="w-8 h-8 -mt-[18px] transition-colors group-hover:text-accent-primary" style={{ color: "var(--ink-primary)" }} />
                      </motion.div>
                    ) : (
                      <motion.div key="icon-x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <X className="w-8 h-8 -mt-[18px] transition-colors group-hover:text-red-500" style={{ color: "var(--ink-primary)" }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                <AnimatePresence>
                  {!isSearching && (
                    <motion.button
                      onClick={() => setIsFilterOpen(true)}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
                      className="w-[52px] h-[52px] -mt-4 flex items-center justify-center rounded-[18px] hover:bg-surface-raised transition-colors group relative"
                      aria-label="Filter"
                    >
                      <SlidersHorizontal className="w-6 h-6 -mt-[18px] transition-colors group-hover:text-accent-primary" style={{ color: filterType !== "All" || filterSort !== "Recommended" ? "var(--accent-primary)" : "var(--ink-muted)" }} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-[16px] overflow-hidden border border-solid"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--surface-raised)" }}>
                  <Skeleton className="w-full h-[220px] rounded-none" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="w-2/3 h-6" />
                      <Skeleton className="w-12 h-6" />
                    </div>
                    <Skeleton className="w-1/2 h-4" />
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Skeleton className="w-16 h-5" />
                      <Skeleton className="w-16 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--ink-primary)" }}>No facilities found</p>
              <p className="text-[14px]" style={{ color: "var(--ink-secondary)" }}>Try a different city or facility name</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {filtered.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                  <FacilityCard 
                    f={{ ...f, favorited: favoritedFacilities.has(f.id) }} 
                    onFav={() => {
                      setFavoritedFacilities(prev => {
                        const next = new Set(prev);
                        if (next.has(f.id)) {
                          next.delete(f.id);
                        } else {
                          next.add(f.id);
                          setToastMessage(`Added ${f.name} to Favorites ♡`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                        return next;
                      });
                    }} 
                    onViewCourts={() => setSelectedFacility(f)} 
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      
      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl mx-auto rounded-t-[32px] border-t shadow-[0_-8px_40px_rgba(0,0,0,0.4)] pb-safe"
              style={{ background: "rgba(18, 25, 35, 0.95)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="p-6">
                <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-6" />
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[22px] font-black text-white tracking-tight" >Filter & Sort</h2>
                  {(filterType !== "All" || filterSort !== "Recommended") && (
                    <motion.button 
                      onClick={() => { setFilterType("All"); setFilterSort("Recommended"); }}
                      whileTap={{ scale: 0.9 }}
                      className="text-sm font-bold text-accent-primary transition-colors hover:text-white"
                    >
                      Reset All
                    </motion.button>
                  )}
                </div>
                
                {/* Court Type */}
                <div className="mb-8">
                  <h3 className="text-[14px] font-bold text-white/60 mb-3 uppercase tracking-wider">Court Type</h3>
                  <div className="flex gap-2 relative bg-white/5 p-1.5 rounded-[20px]">
                    {(["All", "Indoor", "Outdoor"] as const).map(type => (
                      <motion.button
                        key={type}
                        onClick={() => setFilterType(type)}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`relative flex-1 py-3 rounded-[14px] text-[15px] font-bold transition-colors ${filterType === type ? "text-black" : "text-white hover:text-white/80"}`}
                      >
                        {filterType === type && (
                          <motion.div 
                            layoutId="courtTypePill" 
                            className="absolute inset-0 bg-accent-primary rounded-[14px] shadow-[0_4px_12px_rgba(0,217,139,0.3)]" 
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="relative z-10">{type}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-8">
                  <h3 className="text-[14px] font-bold text-white/60 mb-3 uppercase tracking-wider">Sort By</h3>
                  <div className="flex flex-col gap-2">
                    {(["Recommended", "Price (Low to High)", "Rating (High to Low)"] as const).map(sort => (
                      <motion.button
                        key={sort}
                        onClick={() => setFilterSort(sort)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`relative flex items-center justify-between p-4 rounded-[16px] text-[15px] font-bold transition-all border border-solid ${filterSort === sort ? "border-transparent text-accent-primary" : "bg-transparent border-white/[0.08] text-white hover:bg-white/5"}`}
                      >
                        {filterSort === sort && (
                          <motion.div 
                            layoutId="sortPill" 
                            className="absolute inset-0 bg-accent-primary/10 border border-accent-primary rounded-[16px]" 
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="relative z-10">{sort}</span>
                        {filterSort === sort && (
                          <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-accent-primary shadow-[0_0_8px_rgba(0,217,139,0.8)]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={() => setIsFilterOpen(false)}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 rounded-[18px] text-black text-[16px] font-black shadow-[0_0_24px_rgba(0,217,139,0.2)] transition-shadow hover:shadow-[0_0_32px_rgba(0,217,139,0.4)]"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Show Results
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
