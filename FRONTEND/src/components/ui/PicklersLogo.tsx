



export function PicklersLogo({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <img 
      src="/PICKLERS_OFFICIAL_LOGO.svg" 
      alt="Picklers Logo" 
      width={size} 
      className={className}
      style={{ objectFit: "contain" }} 
    />
  );
}
