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
                <div key={i} className="flex items-center gap-3.5 text-foreground/40 font-semibold text-lg md:text-xl tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:!text-foreground hover:!opacity-100 group-hover:opacity-30 hover:scale-110 hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.2)] select-none">
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.label}
                    className="h-8 md:h-10 w-auto object-contain drop-shadow-md rounded-sm" 
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                    }} 
                  />
                  {brand.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
