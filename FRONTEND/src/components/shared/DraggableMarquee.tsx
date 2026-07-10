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
                <div key={i} className="flex items-center gap-3.5 text-foreground/40 font-semibold text-lg md:text-xl tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:!text-foreground hover:!opacity-100 group-hover:opacity-30 hover:scale-110 select-none">
                  
                  <div className="relative flex items-center justify-center w-28 h-10 md:w-36 md:h-12 group/logo">
                    {/* Contrast Halo: Creates a soft white glow behind all logos, ensuring black logos are visible on dark backgrounds */}
                    <img 
                      src={brand.logoUrl} 
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain brightness-0 invert blur-[6px] opacity-30 group-hover/logo:opacity-60 transition-opacity duration-500 pointer-events-none select-none" 
                    />
                    
                    {/* Main Logo */}
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.label}
                      className="relative z-10 w-full h-full object-contain filter grayscale opacity-70 group-hover/logo:grayscale-0 group-hover/logo:opacity-100 group-hover/logo:drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] transition-all duration-500" 
                      onError={(e) => { 
                        if (e.currentTarget.parentElement) {
                           e.currentTarget.parentElement.style.display = 'none'; 
                           if (e.currentTarget.parentElement.nextElementSibling) {
                             e.currentTarget.parentElement.nextElementSibling.classList.remove('hidden');
                           }
                        }
                      }} 
                    />
                  </div>

                  {/* Fallback Text if Logo Fails */}
                  <span className="hidden whitespace-nowrap">{brand.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
