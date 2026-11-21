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
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,214,154,0.15)] animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-t-[#00D69A] border-r-transparent border-b-[#00D69A]/30 border-l-transparent animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#F5F8F6] tracking-tight">{label}</h4>
        <p className="text-xs text-[#98A9A1]">{sublabel}</p>
      </div>
    </div>
  );
}

export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#132820]/60 animate-pulse border border-[rgba(255,255,255,0.03)]",
        className
      )}
    />
  );
}
