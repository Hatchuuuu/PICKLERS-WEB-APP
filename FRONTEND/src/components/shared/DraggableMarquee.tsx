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
            <div key={set} className="flex-[0_0_auto] min-w-0 flex items-center gap-6 md:gap-8 pl-6 md:pl-8 group">
              {logos.map((logo, i) => (
                <div key={i} className="flex items-center gap-3 text-foreground/60 font-medium text-base md:text-lg tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:!text-foreground hover:!opacity-100 group-hover:opacity-40 hover:scale-105 select-none px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.15)]">
                  <logo.icon className="w-4 h-4 md:w-5 md:h-5 opacity-70" strokeWidth={2.5} /> {logo.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
