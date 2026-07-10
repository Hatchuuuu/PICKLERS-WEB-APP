import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Navigation, Compass, Search, Volume2 } from "lucide-react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface NavigationOverlayProps {
  destination: string;
  onClose: () => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DUMMY_ROUTE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [123.3050, 9.3110],
      [123.3055, 9.3140],
      [123.3060, 9.3180],
      [123.3090, 9.3250],
      [123.3120, 9.3300]
    ]
  }
};

export function NavigationOverlay({ destination, onClose }: NavigationOverlayProps) {
  const [viewState, setViewState] = useState<any>({
    longitude: 123.3050,
    latitude: 9.3110,
    zoom: 15.5,
    pitch: 65,
    bearing: 10
  });

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-background"
      >
        {/* Real Mapbox Map */}
        <div className="absolute inset-0 z-0 bg-background">
          {MAPBOX_TOKEN ? (
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/navigation-night-v1"
              mapboxAccessToken={MAPBOX_TOKEN}
              attributionControl={false}
              interactive={true}
            >
              {/* The Route Path */}
              <Source id="route" type="geojson" data={DUMMY_ROUTE}>
                <Layer
                  id="route-line"
                  type="line"
                  layout={{ "line-join": "round", "line-cap": "round" }}
                  paint={{ 
                    "line-color": "#00C67F", 
                    "line-width": ["interpolate", ["linear"], ["zoom"], 12, 4, 16, 12, 22, 20],
                    "line-opacity": 0.9
                  }}
                />
              </Source>

              {/* The Car Marker */}
              <Marker longitude={123.3050} latitude={9.3110} anchor="center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-14 relative" style={{ transform: 'perspective(200px) rotateX(40deg)' }}>
                    <div className="absolute inset-0 bg-surface-base rounded-lg shadow-2xl flex items-center justify-center border border-surface-border"
                      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)" }}>
                      <Navigation className="w-7 h-7 text-blue-500" fill="currentColor" />
                    </div>
                  </div>
                  {/* Glowing aura under car */}
                  <div className="w-24 h-8 bg-blue-500/40 rounded-full blur-xl absolute -bottom-4" />
                  
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-bold text-[13px] shadow-lg border border-emerald-400/30 whitespace-nowrap">
                    National Highway
                  </div>
                </div>
              </Marker>
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground p-8 text-center">
              Missing Mapbox API Key. Please add VITE_MAPBOX_TOKEN to .env
            </div>
          )}
        </div>

        {/* Top Instruction Banner */}
        <div className="relative z-10 pt-12 px-4 pointer-events-none">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
            className="bg-gradient-to-r from-emerald-600/95 to-emerald-700/95 backdrop-blur-3xl rounded-[32px] p-4 flex items-center gap-4 shadow-2xl pointer-events-auto max-w-lg mx-auto border border-white/20"
            style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3)" }}
          >
            <div className="flex flex-col items-center justify-center w-12 h-12">
              <ArrowUp className="w-9 h-9 text-white stroke-[3] drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-white text-emerald-700 font-black text-[13px] px-2 py-0.5 rounded-md shrink-0 shadow-sm">7</div>
                <div className="text-white font-bold text-[18px] tracking-tight truncate drop-shadow-sm">{destination}</div>
              </div>
              <div className="text-emerald-50 text-[14px] font-medium leading-tight line-clamp-2">
                Road / Negros South Road / Western Nautical Hwy
              </div>
            </div>
            <div className="w-12 h-12 bg-black/20 border border-white/20 rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <Compass className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Floating Controls Right */}
        <div className="absolute right-4 bottom-44 flex flex-col gap-3 z-10">
          {[Compass, Search, Volume2].map((Icon, idx) => (
            <motion.button 
              key={idx}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (idx * 0.1), type: "spring" }}
              className="w-12 h-12 rounded-full bg-surface-base/90 dark:bg-[#0A1118]/90 backdrop-blur-3xl flex items-center justify-center border border-black/5 dark:border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.2)] active:scale-90 transition-transform"
            >
              <Icon className="w-5 h-5 text-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Re-center Button Left */}
        <motion.button 
          onClick={() => setViewState({ longitude: 123.3050, latitude: 9.3110, zoom: 15.5, pitch: 65, bearing: 10, transitionDuration: 1000 })}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="absolute left-4 bottom-44 px-5 py-3 rounded-full bg-surface-base/90 dark:bg-[#0A1118]/90 backdrop-blur-3xl flex items-center gap-2 border border-black/5 dark:border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.2)] active:scale-90 transition-transform z-10"
        >
          <Navigation className="w-4 h-4 text-blue-500" fill="currentColor" />
          <span className="text-foreground font-bold text-[14px]">Re-center</span>
        </motion.button>

        {/* Bottom Status Sheet */}
        <div className="mt-auto relative z-20 w-full pointer-events-none">
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0 }}
            className="bg-surface-base/95 dark:bg-[#0A1118]/95 backdrop-blur-3xl rounded-t-[32px] p-6 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.4)] border-t border-black/5 dark:border-white/10 pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full" />
            
            <div className="w-full flex items-center justify-between pt-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground font-black text-[40px] tracking-tight leading-none drop-shadow-sm">37</span>
                  <span className="text-foreground/80 font-bold text-[22px] tracking-tight">min</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] ml-1" />
                </div>
                <div className="text-foreground/60 text-[16px] font-semibold mt-1">
                  24 km · 11:42 PM
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="w-[52px] h-[52px] rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center active:scale-95 transition-all">
                  <Navigation className="w-6 h-6 text-foreground" />
                </button>
                <button 
                  onClick={onClose}
                  className="px-8 py-3.5 rounded-full bg-[#FF3B30] hover:bg-[#FF453A] flex items-center justify-center font-bold text-white text-[17px] active:scale-95 transition-all shadow-[0_8px_16px_rgba(255,59,48,0.3)]"
                >
                  End
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
