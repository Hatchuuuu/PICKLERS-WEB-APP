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
  const [viewState, setViewState] = useState({
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
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#1B2533]"
      >
        {/* Real Mapbox Map */}
        <div className="absolute inset-0 z-0 bg-[#121821]">
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
                    <div className="absolute inset-0 bg-white rounded-lg shadow-2xl flex items-center justify-center border border-gray-200"
                      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,1)" }}>
                      <Navigation className="w-7 h-7 text-blue-500" fill="currentColor" />
                    </div>
                  </div>
                  {/* Glowing aura under car */}
                  <div className="w-24 h-8 bg-blue-500/40 rounded-full blur-xl absolute -bottom-4" />
                  
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-[#0E7465] text-white font-bold text-sm shadow-lg border border-white/10 whitespace-nowrap">
                    National Highway
                  </div>
                </div>
              </Marker>
            </Map>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white p-8 text-center">
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
            className="bg-[#0E7465] rounded-3xl p-4 flex items-center gap-4 shadow-2xl pointer-events-auto max-w-lg mx-auto"
            style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)" }}
          >
            <div className="flex flex-col items-center justify-center w-12 h-12">
              <ArrowUp className="w-8 h-8 text-white stroke-[3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-white text-black font-bold text-sm px-2 rounded-md shrink-0">7</div>
                <div className="text-white font-bold text-[17px] tracking-tight truncate">{destination}</div>
              </div>
              <div className="text-white/80 text-[13px] font-medium leading-tight line-clamp-2">
                Road / Negros South Road / Western Nautical Hwy
              </div>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <Compass className="w-6 h-6 text-blue-500" />
            </div>
          </motion.div>
        </div>

        {/* Floating Controls Right */}
        <div className="absolute right-4 bottom-48 flex flex-col gap-3 z-10">
          {[Compass, Search, Volume2].map((Icon, idx) => (
            <motion.button 
              key={idx}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (idx * 0.1), type: "spring" }}
              className="w-12 h-12 rounded-full bg-[#202936]/90 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-xl active:scale-90 transition-transform"
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.button>
          ))}
        </div>

        {/* Re-center Button Left */}
        <motion.button 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="absolute left-4 bottom-48 px-5 py-3 rounded-full bg-[#202936]/90 backdrop-blur-xl flex items-center gap-2 border border-white/10 shadow-xl active:scale-90 transition-transform z-10"
        >
          <Navigation className="w-4 h-4 text-white" fill="currentColor" />
          <span className="text-white font-semibold text-sm">Re-center</span>
        </motion.button>

        {/* Bottom Status Sheet */}
        <div className="mt-auto relative z-20 w-full pointer-events-none">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0 }}
            className="bg-[#11161D] rounded-t-[32px] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.7)] border-t border-white/10 pointer-events-auto flex items-center justify-between"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />
            
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-4xl tracking-tight">37</span>
                <span className="text-white/80 font-bold text-xl">min</span>
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] ml-1" />
              </div>
              <div className="text-white/60 text-[15px] font-medium mt-1">
                24 km · 11:42 PM
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
                <Navigation className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-4 rounded-full bg-red-500 flex items-center justify-center font-bold text-white text-lg active:scale-90 transition-transform shadow-xl shadow-red-500/20"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
