"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { FacilityCard } from "@/components/shared/FacilityCard";
import { FacilityDetailView } from "@/components/shared/FacilityDetailView";
import { useApp } from "@/contexts/AppContext";
import { Facility } from "@/types";


export default function PlayTab() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationName, setLocationName] = useState("Metro Manila");

  useEffect(() => {
    const savedLocation = localStorage.getItem("picklers_user_location");
    if (savedLocation) {
      setLocationName(savedLocation);
    }
  }, []);

  const updateLocation = (name: string) => {
    setLocationName(name);
    localStorage.setItem("picklers_user_location", name);
  };
  const [isLocating, setIsLocating] = useState(false);
  const { facilities, favoritedFacilities, setFavoritedFacilities } = useApp();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<"All" | "Indoor" | "Outdoor">("All");
  const [filterSort, setFilterSort] = useState<"Recommended" | "Price (Low to High)" | "Rating (High to Low)">("Recommended");

  useEffect(() => {
    // Simulate network latency for loading skeleton showcase
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!mapboxToken) throw new Error("Mapbox token missing");
          
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=neighborhood,locality,place`);
          const data = await res.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            let fullName = feature.text;
            
            if (!feature.place_type.includes('place') && feature.context) {
              const placeContext = feature.context.find((c: { id: string, text: string }) => c.id.startsWith('place.'));
              if (placeContext) {
                fullName = `${feature.text}, ${placeContext.text}`;
              }
            }
            updateLocation(fullName);
          } else {
            throw new Error("Location not found");
          }
        } catch (error) {
          console.error(error);
          showToast("Could not determine your location", "error");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        showToast("Location permission denied", "error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const filtered = facilities
    .filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
    )
    .filter(f => filterType === "All" || f.type === filterType)
    .sort((a, b) => {
      if (filterSort === "Price (Low to High)") {
        const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, ''));
        const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, ''));
        return priceA - priceB;
      }
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
          <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
            <AnimatePresence>
              {!isSearching ? (
                <motion.div 
                  key="title" 
                  initial={{ opacity: 0, x: -20, filter: "blur(8px)" }} 
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
                  exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, x: 20, filter: "blur(8px)" }} 
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
                  exit={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                  <motion.button 
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:flex items-center h-[52px] gap-1.5 text-[14px] font-bold px-5 rounded-[18px] border border-solid select-none transition-colors"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--ink-primary)", background: "var(--surface-interactive)" }}>
                    <AnimatePresence mode="wait">
                      {isLocating ? (
                        <motion.div key="loading" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} className="mr-1">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="ready" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} className="flex items-center mr-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                          <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="popLayout">
                      <motion.span 
                        key={isLocating ? "locating" : locationName}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: isLocating ? 0.6 : 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isLocating ? "Locating..." : locationName}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
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
                  <div className="w-full h-[220px] rounded-none animate-pulse bg-surface-interactive" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="w-2/3 h-6 animate-pulse bg-surface-interactive rounded" />
                      <div className="w-12 h-6 animate-pulse bg-surface-interactive rounded" />
                    </div>
                    <div className="w-1/2 h-4 animate-pulse bg-surface-interactive rounded" />
                    <div className="flex gap-2 mt-2">
                      <div className="w-16 h-5 animate-pulse bg-surface-interactive rounded" />
                      <div className="w-16 h-5 animate-pulse bg-surface-interactive rounded" />
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
                          showToast(`Added ${f.name} to Favorites ♡`, "success");
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
              className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl mx-auto rounded-t-[32px] border-t shadow-2xl dark:shadow-[0_-8px_40px_rgba(0,0,0,0.4)] pb-safe bg-surface-base/95 border-border dark:bg-[#121923]/95 dark:border-white/[0.08] backdrop-blur-2xl"
            >
              <div className="p-6">
                <div className="w-12 h-1.5 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 mx-auto mb-6" />
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[22px] font-black text-foreground tracking-tight" >Filter & Sort</h2>
                  {(filterType !== "All" || filterSort !== "Recommended") && (
                    <motion.button 
                      onClick={() => { setFilterType("All"); setFilterSort("Recommended"); }}
                      whileTap={{ scale: 0.9 }}
                      className="text-sm font-bold text-accent-primary transition-colors hover:text-foreground"
                    >
                      Reset All
                    </motion.button>
                  )}
                </div>
                
                {/* Court Type */}
                <div className="mb-8">
                  <h3 className="text-[14px] font-bold text-foreground/60 mb-3 uppercase tracking-wider">Court Type</h3>
                  <div className="flex gap-2 relative bg-surface-interactive/80 p-1.5 rounded-[20px]">
                    {(["All", "Indoor", "Outdoor"] as const).map(type => (
                      <motion.button
                        key={type}
                        onClick={() => setFilterType(type)}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`relative flex-1 py-3 rounded-[14px] text-[15px] font-bold transition-colors ${filterType === type ? "text-foreground" : "text-foreground hover:text-foreground/80"}`}
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
                  <h3 className="text-[14px] font-bold text-foreground/60 mb-3 uppercase tracking-wider">Sort By</h3>
                  <div className="flex flex-col gap-2">
                    {(["Recommended", "Price (Low to High)", "Rating (High to Low)"] as const).map(sort => (
                      <motion.button
                        key={sort}
                        onClick={() => setFilterSort(sort)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`relative flex items-center justify-between p-4 rounded-[16px] text-[15px] font-bold transition-all border border-solid ${filterSort === sort ? "border-transparent text-accent-primary" : "bg-transparent border-border text-foreground hover:bg-surface-interactive/80"}`}
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
                  className="w-full py-4 rounded-[18px] text-foreground text-[16px] font-black shadow-[0_0_24px_rgba(0,217,139,0.2)] transition-shadow hover:shadow-[0_0_32px_rgba(0,217,139,0.4)]"
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
