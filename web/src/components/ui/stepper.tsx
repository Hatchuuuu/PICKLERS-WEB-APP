"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface StepperContextType {
  value: number;
  onValueChange: (val: number) => void;
}

const StepperContext = createContext<StepperContextType | undefined>(undefined);

export function Stepper({ value, onValueChange, className, children }: { value: number; onValueChange: (val: number) => void; className?: string; children?: React.ReactNode }) {
  return (
    <StepperContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </StepperContext.Provider>
  );
}

export function StepperNav({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}

export function StepperItem({ step, completed, className, children }: { step: number; completed?: boolean; className?: string; children?: React.ReactNode }) {
  const context = useContext(StepperContext);
  const isActive = context?.value === step;
  return (
    <div
      className={cn(className, "group")}
      data-state={completed ? "completed" : isActive ? "active" : "inactive"}
    >
      {children}
    </div>
  );
}

export function StepperTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}

export function StepperIndicator({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function StepperTitle({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function StepperPanel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function StepperContent({ value, className, children }: { value: number; className?: string; children?: React.ReactNode }) {
  const context = useContext(StepperContext);
  if (context?.value !== value) return null;
  return <div className={className}>{children}</div>;
}
