import React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export function LoadingState({
  label = "Syncing environmental sensors...",
  sublabel = "Retrieving atmospheric data from Open-Meteo",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]",
        className
      )}
    >
      <div className="relative w-12 h-12 flex items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(77,184,255,0.2)] animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-t-[#4DB8FF] border-r-transparent border-b-[#4DB8FF]/30 border-l-transparent animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#F2F6FA] tracking-tight">{label}</h4>
        <p className="text-xs text-[#A3B3C2]">{sublabel}</p>
      </div>
    </div>
  );
}

export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#16222F]/60 animate-pulse border border-[rgba(255,255,255,0.03)]",
        className
      )}
    />
  );
}
