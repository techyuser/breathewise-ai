"use client";

import React, { useState, useEffect } from "react";
import { AirQualityData } from "@/types/air-quality";
import { getAQIColor } from "@/lib/aqi-utils";
import { Card } from "@/components/ui/Card";
import { Activity } from "lucide-react";
import { motion } from "motion/react";

interface AqiMeterCardProps {
  data: AirQualityData;
}

export function AqiMeterCard({ data }: AqiMeterCardProps) {
  const { color, borderColor, badgeBg } = getAQIColor(data.usAqi);
  const [displayAqi, setDisplayAqi] = useState(0);

  // Live count-up animation for the AQI number (0 -> target)
  useEffect(() => {
    let animationFrameId: number;
    const target = data.usAqi;
    const duration = 1200; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      setDisplayAqi(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [data.usAqi]);

  // SVG circular gauge geometry
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const aqiRatio = Math.min(Math.max(data.usAqi / 500, 0.05), 1);
  const targetOffset = circumference * (1 - aqiRatio);

  return (
    <Card
      interactive
      elevated
      className="p-4 rounded-3xl flex flex-col justify-between space-y-2.5 relative group overflow-hidden"
    >
      {/* Soft ambient aura */}
      <div
        className="absolute -top-14 -right-14 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {/* Top Header — Clean single line with zero truncation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: badgeBg,
              borderColor: borderColor,
              color: color,
            }}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-[#F5F8F6] whitespace-nowrap">
            AQI
          </span>
        </div>

        <span
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 shadow-sm"
          style={{
            color: color,
            backgroundColor: badgeBg,
            borderColor: borderColor,
          }}
        >
          {data.category}
        </span>
      </div>

      {/* Center: Animated Circular Gauge with Live Increasing Meter */}
      <div className="relative flex items-center justify-center py-0.5">
        <svg
          className="w-24 h-24 -rotate-90 transform"
          viewBox="0 0 90 90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="6"
            fill="none"
          />

          {/* Animated active meter stroke */}
          <motion.circle
            cx="45"
            cy="45"
            r={radius}
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}90)`,
            }}
          />
        </svg>

        {/* Center: Live counting number ONLY */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span
            className="text-3xl font-extrabold tracking-tighter tabular-nums leading-none"
            style={{ color }}
          >
            {displayAqi}
          </span>
        </div>
      </div>

      {/* Bottom Dominant Pollutant & WHO Cap */}
      <div className="space-y-1 pt-1.5 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#98A9A1] whitespace-nowrap">Dominant PM2.5</span>
          <span className="font-semibold text-[#F5F8F6] tabular-nums whitespace-nowrap">
            {data.nowCastConcentration} µg/m³
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#64786E]">
          <span className="whitespace-nowrap">WHO 24h Cap</span>
          <span className="whitespace-nowrap">15 µg/m³</span>
        </div>

        {/* Visual PM2.5 ratio bar */}
        <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mt-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                Math.max((data.nowCastConcentration / 150) * 100, 8),
                100
              )}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </Card>
  );
}
