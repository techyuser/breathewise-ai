import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Environmental Telemetry Unavailable",
  message = "Could not synchronize with the atmospheric sensor network. Please check your connection and retry.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-8 border-[rgba(255,92,92,0.25)] flex flex-col items-center text-center max-w-md mx-auto my-6 space-y-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[rgba(255,92,92,0.14)] border border-[rgba(255,92,92,0.3)] flex items-center justify-center text-[#FF5C5C]">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h4 className="text-base font-semibold text-[#F2F6FA]">{title}</h4>
        <p className="text-xs text-[#A3B3C2] leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
}
