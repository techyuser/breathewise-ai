"use client";

import React, { useState, useEffect } from "react";
import { AirQualityData } from "@/types/air-quality";
import { getAQIColor } from "@/lib/aqi-utils";
import { getCpcbColor } from "@/lib/cpcb-utils";
import { Card } from "@/components/ui/Card";
import { motion } from "motion/react";

interface HeroAqiCardProps {
  data: AirQualityData;
}

export function HeroAqiCard({ data }: HeroAqiCardProps) {
  const isCpcb = data.activeStandard === "INDIA_CPCB";

  const targetAqi = isCpcb ? data.indiaAqi : data.usAqi;
  const activeCategory = isCpcb ? data.indiaCategory : data.category;
  const colorScheme = isCpcb ? getCpcbColor(targetAqi) : getAQIColor(targetAqi);
  const { color, borderColor, badgeBg } = colorScheme;

  const [displayAqi, setDisplayAqi] = useState(0);

  // Smooth count-up animation for the AQI number (0 -> target)
  useEffect(() => {
    let animationFrameId: number;
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayAqi(Math.round(targetAqi * ease));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetAqi]);

  // Circular gauge geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.72
  const aqiRatio = Math.min(Math.max(targetAqi / 500, 0.05), 1);
  const targetOffset = circumference * (1 - aqiRatio);

  return (
    <Card
      elevated
      className="p-4 md:p-4.5 rounded-3xl relative overflow-hidden shrink-0"
    >
      {/* 3D Volumetric Ambient Light Pool behind the meter */}
      <div
        className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-[75px] opacity-25 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="absolute top-1/2 right-0 w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(0,214,154,0.12)_0%,transparent_70%)] blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
        {/* Left: 3D Live AQI Radial Arc Meter with Layered Depth */}
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Subtle Outer 3D Ring */}
          <div className="absolute inset-[-6px] rounded-full border border-[rgba(255,255,255,0.08)] shadow-[0_0_24px_rgba(0,0,0,0.7)] pointer-events-none" />

          <svg
            className="w-32 h-32 md:w-36 md:h-36 -rotate-90 transform"
            viewBox="0 0 130 130"
            aria-hidden="true"
            style={{ transform: "translateZ(16px)" }}
          >
            {/* Background 3D groove */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8.5"
              fill="none"
              style={{
                filter: "drop-shadow(inset 0 2px 4px rgba(0,0,0,0.6))",
              }}
            />

            {/* Glowing 3D active meter stroke */}
            <motion.circle
              cx="65"
              cy="65"
              r={radius}
              stroke={color}
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: targetOffset }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                filter: `drop-shadow(0 0 12px ${color}90) drop-shadow(0 4px 16px rgba(0,0,0,0.7))`,
              }}
            />
          </svg>

          {/* Central 3D Frosted Glass Pod — Floating in Front */}
          <div
            className="absolute inset-5 rounded-full bg-gradient-to-br from-[rgba(14,34,26,0.88)] to-[rgba(7,18,14,0.95)] border border-[rgba(255,255,255,0.22)] shadow-[0_12px_28px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.32),inset_0_-2px_4px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center select-none pointer-events-none backdrop-blur-2xl"
            style={{ transform: "translateZ(36px)" }}
          >
            <span
              className="text-3xl md:text-4xl font-extrabold tracking-tighter tabular-nums leading-none"
              style={{ color, textShadow: `0 0 24px ${color}70` }}
            >
              {displayAqi}
            </span>
            <span className="text-[9px] font-bold text-[#98A9A1] tracking-widest uppercase mt-0.5">
              {isCpcb ? "IN NAQI" : "US AQI"}
            </span>
          </div>
        </div>

        {/* Right: Health Impact & Dominant Smog Matrix */}
        <div className="flex-1 space-y-1.5 md:space-y-2 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className="text-xs font-bold px-3 py-0.5 rounded-full border whitespace-nowrap shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
              style={{
                color: color,
                backgroundColor: badgeBg,
                borderColor: borderColor,
              }}
            >
              {activeCategory}
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#F5F8F6] leading-snug">
            {targetAqi > 200
              ? "Severe Smog Stagnation Active"
              : targetAqi > 100
              ? "Elevated Atmospheric Particulates"
              : "Air Quality Within Safe Bounds"}
          </h2>

          <p className="text-xs text-[#98A9A1] leading-relaxed max-w-2xl">
            {data.healthSummary}
          </p>

          {/* Dominant Pollutant vs WHO Reference Cap */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#64786E]">Dominant:</span>
              <span className="font-semibold text-[#F5F8F6]">
                {data.primaryPollutant} (
                {data.primaryPollutant === "PM10"
                  ? data.pollutants.pm10?.value ?? 78
                  : data.pollutants.pm2_5?.value ?? data.nowCastConcentration}{" "}
                µg/m³)
              </span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-[rgba(255,255,255,0.1)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#64786E]">WHO 24h Guideline:</span>
              <span className="font-semibold text-[#00D69A]">15 µg/m³</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
