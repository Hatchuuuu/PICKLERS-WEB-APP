import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-md bg-muted/20", className)}
      style={{
        background: "linear-gradient(90deg, var(--surface-interactive) 0%, var(--surface-raised) 50%, var(--surface-interactive) 100%)",
        backgroundSize: "200% 100%",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s linear infinite",
        ...props.style
      }}
      {...props}
    />
  );
}
