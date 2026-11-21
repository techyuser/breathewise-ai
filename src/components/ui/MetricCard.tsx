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
      <div className="flex items-center justify-between text-[#A3B3C2] text-xs font-medium mb-2">
        <span>{label}</span>
        {icon && (
          <div className="text-[#A3B3C2] group-hover:text-[#4DB8FF] transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-semibold tracking-tight text-[#F2F6FA]"
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-[#A3B3C2] font-normal">{unit}</span>}
      </div>
      {subtext && (
        <p className="mt-1.5 text-xs text-[#8496A8] truncate">{subtext}</p>
      )}
    </Card>
  );
}
