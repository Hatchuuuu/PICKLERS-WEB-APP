import { useRef, useState, useEffect } from "react";
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "motion/react";
import { Trophy, MapPin, ShieldCheck, Building, Zap } from "lucide-react";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const logos = [
  { icon: Trophy, label: "DUPR" },
  { icon: MapPin, label: "Manila Polo Club" },
  { icon: ShieldCheck, label: "PPA Tour" },
  { icon: Building, label: "The Picklerry" },
  { icon: Zap, label: "Joola" },
];

export function DraggableMarquee() {
  const baseVelocity = -1.5;
  const baseX = useMotionValue(0);
  const scrollVelocity = useMotionValue(baseVelocity);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // We have 4 sets rendered to ensure infinite scrolling looks seamless
  // Wrap from 0 to -25% (since 4 sets total)
  const x = useTransform(baseX, (v) => `${wrap(0, -25, v)}%`);

  useAnimationFrame((t, delta) => {
    if (isDragging) return;
    
    let moveBy = smoothVelocity.get() * (delta / 16);
    baseX.set(baseX.get() + moveBy);
  });

  const handleDragStart = () => {
    setIsDragging(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  };

  const handleDragEnd = () => {
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex w-full max-w-[2000px] overflow-hidden cursor-grab active:cursor-grabbing" style={{ maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)" }}>
      <motion.div 
        ref={containerRef}
        className="flex min-w-max items-center gap-16 md:gap-32 px-8 group will-change-transform"
        style={{ x }}
        drag="x"
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={(e, info) => {
          const currentX = baseX.get();
          // Convert pixel delta to percentage for perfect 1:1 tracking
          const containerWidth = containerRef.current?.offsetWidth || 1000;
          const percentageDelta = (info.delta.x / containerWidth) * 100;
          baseX.set(currentX + percentageDelta); 
        }}
        dragConstraints={{ left: 0, right: 0 }}
      >
        {[1, 2, 3, 4].map((set) => (
          <div key={set} className="flex items-center gap-16 md:gap-32">
            {logos.map((logo, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground/40 font-semibold text-xl md:text-2xl tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:!text-foreground hover:!opacity-100 group-hover:opacity-30 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] select-none">
                <logo.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} /> {logo.label}
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
