import React from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  statusColor?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  icon,
  statusColor,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("p-4 group", className)}>
      <div className="flex items-center justify-between text-[#98A9A1] text-xs font-medium mb-2">
        <span>{label}</span>
        {icon && (
          <div className="text-[#98A9A1] group-hover:text-[#00D69A] transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-semibold tracking-tight text-[#F5F8F6]"
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-[#98A9A1] font-normal">{unit}</span>}
      </div>
      {subtext && (
        <p className="mt-1.5 text-[11px] text-[#63786F] truncate">{subtext}</p>
      )}
    </Card>
  );
}
