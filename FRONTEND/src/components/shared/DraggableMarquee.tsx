import { useEffect } from "react";
import { Trophy, MapPin, ShieldCheck, Building, Zap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

const brands = [
  { label: "JOOLA", domain: "joolausa.com" },
  { label: "Selkirk", domain: "selkirk.com" },
  { label: "Six Zero", domain: "sixzeropickleball.com" },
  { label: "CRBN", domain: "crbnpickleball.com" },
  { label: "Wilson", domain: "wilson.com" },
  { label: "Gearbox", domain: "gearboxsports.com" },
  { label: "Vatic Pro", domain: "vaticpro.com" },
  { label: "Pelago", domain: "pelagosports.com" },
  { label: "Palakol Performance", domain: "palakolphilippines.com" },
  { label: "Bread & Butter", domain: "bnbpickleball.com" },
  { label: "Honolulu Pickleball", domain: "honolulupickleballcompany.com" },
  { label: "Holbrook", domain: "holbrookpickleball.com" },
  { label: "11SIX24", domain: "11six24.com" },
  { label: "Franklin", domain: "franklinsports.com" },
  { label: "Head", domain: "head.com" },
  { label: "Black Knight", domain: "blackknight.ca" },
  { label: "Questor", domain: "olympicvillageunited.com" },
  { label: "Tecnifibre", domain: "tecnifibre.com" },
  { label: "Mizuno", domain: "mizunousa.com" },
  { label: "Volair", domain: "volair.com" }
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
                    src={`https://logo.clearbit.com/${brand.domain}?size=100`} 
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
