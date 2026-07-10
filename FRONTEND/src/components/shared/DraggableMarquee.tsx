import { useEffect } from "react";
import { Trophy, MapPin, ShieldCheck, Building, Zap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

const brands = [
  { "label": "JOOLA", "logoUrl": "/brand-logos/joola.png" },
  { "label": "Selkirk", "logoUrl": "/brand-logos/selkirk.png" },
  { "label": "Six Zero", "logoUrl": "/brand-logos/six-zero.png" },
  { "label": "CRBN", "logoUrl": "/brand-logos/crbn.png" },
  { "label": "Wilson", "logoUrl": "/brand-logos/wilson.png" },
  { "label": "Gearbox", "logoUrl": "/brand-logos/gearbox.png" },
  { "label": "Vatic Pro", "logoUrl": "/brand-logos/vatic-pro.png" },
  { "label": "Pelago", "logoUrl": "/brand-logos/pelago.svg" },
  { "label": "Palakol Performance", "logoUrl": "/brand-logos/palakol-performance.png" },
  { "label": "Bread & Butter", "logoUrl": "/brand-logos/bread-butter.png" },
  { "label": "Honolulu Pickleball", "logoUrl": "/brand-logos/honolulu.svg" },
  { "label": "Holbrook", "logoUrl": "/brand-logos/holbrook.png" },
  { "label": "11SIX24", "logoUrl": "/brand-logos/11six24.png" },
  { "label": "Franklin", "logoUrl": "/brand-logos/franklin.png" },
  { "label": "Head", "logoUrl": "/brand-logos/head.svg" },
  { "label": "Black Knight", "logoUrl": "/brand-logos/black-knight.png" },
  { "label": "Questor", "logoUrl": "/brand-logos/questor.png" },
  { "label": "Tecnifibre", "logoUrl": "/brand-logos/tecnifibre.png" },
  { "label": "Mizuno", "logoUrl": "/brand-logos/mizuno.png" },
  { "label": "Volair", "logoUrl": "/brand-logos/volair.png" }
];

export function DraggableMarquee() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: true },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1.6, // 2x faster ambient speed
        stopOnInteraction: true, // We will manually restart it to control the exact delay
        direction: "backward", // Flows to the RIGHT
      })
    ]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (!autoScroll) return;

    // Wait exactly 200ms (very short pause) after they let go, then resume!
    const resumeAutoScroll = () => {
      setTimeout(() => {
        if (!autoScroll.isPlaying()) {
          autoScroll.play();
        }
      }, 200); 
    };

    emblaApi.on("pointerUp", resumeAutoScroll);
    return () => {
      emblaApi.off("pointerUp", resumeAutoScroll);
    };
  }, [emblaApi]);

  return (
    <div className="w-full max-w-[2000px] overflow-hidden cursor-grab active:cursor-grabbing" style={{ maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)" }}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {[1, 2, 3].map((set) => (
            <div key={set} className="flex-[0_0_auto] min-w-0 flex items-center gap-16 md:gap-24 pl-16 md:pl-24 group">
              {brands.map((brand, i) => (
                <div key={i} className="relative flex flex-col items-center justify-center gap-4 w-36 h-32 md:w-44 md:h-36 rounded-2xl border border-white/[0.03] bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.06] hover:border-white/[0.1] hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] select-none group/item overflow-hidden">
                  
                  {/* Subtle inner radial glow for better contrast on black logos without looking like a harsh box */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_60%)] opacity-50 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <img 
                    src={brand.logoUrl} 
                    alt={brand.label}
                    className="relative z-10 h-8 md:h-10 w-auto max-w-[100px] md:max-w-[140px] object-contain drop-shadow-md rounded-sm transition-transform duration-500 group-hover/item:scale-105" 
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                    }} 
                  />
                  
                  <span className="relative z-10 text-foreground/40 group-hover/item:text-foreground/80 font-semibold text-[10px] md:text-xs tracking-[0.25em] uppercase transition-colors duration-300 text-center">
                    {brand.label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
