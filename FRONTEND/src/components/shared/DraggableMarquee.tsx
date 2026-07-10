import { useEffect } from "react";
import { Trophy, MapPin, ShieldCheck, Building, Zap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

const logos = [
  { icon: Trophy, label: "DUPR" },
  { icon: MapPin, label: "Manila Polo Club" },
  { icon: ShieldCheck, label: "PPA Tour" },
  { icon: Building, label: "The Picklerry" },
  { icon: Zap, label: "Joola" },
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
          {[1, 2, 3, 4, 5, 6].map((set) => (
            <div key={set} className="flex-[0_0_auto] min-w-0 flex items-center gap-16 md:gap-32 pl-16 md:pl-32 group">
              {logos.map((logo, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground/40 font-semibold text-xl md:text-2xl tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:!text-foreground hover:!opacity-100 group-hover:opacity-30 hover:scale-110 hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.2)] select-none">
                  <logo.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} /> {logo.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
