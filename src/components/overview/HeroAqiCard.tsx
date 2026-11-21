"use client";

import React, { useState, useEffect } from "react";
import { AirQualityData } from "@/types/air-quality";
import { getAQIColor } from "@/lib/aqi-utils";
import { getCpcbColor } from "@/lib/cpcb-utils";
import { Card } from "@/components/ui/Card";
import { motion } from "motion/react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
} from "lucide-react";

interface HeroAqiCardProps {
  data: AirQualityData;
}

export function HeroAqiCard({ data }: HeroAqiCardProps) {
  const isCpcb = data.activeStandard === "INDIA_CPCB";

  const targetAqi = isCpcb ? data.indiaAqi : data.usAqi;
  const isDataSufficient = isCpcb
    ? (data.isCpcbDataSufficient !== false && targetAqi !== null)
    : (data.isNowCastDataSufficient !== false && targetAqi !== null);

  const activeCategory = isDataSufficient
    ? (isCpcb ? data.indiaCategory : data.category)
    : "Insufficient Data";
  const colorScheme = isCpcb ? getCpcbColor(targetAqi) : getAQIColor(targetAqi);
  const { color, borderColor, badgeBg } = colorScheme;

  // Severity theming: Poor or worse gets 1px severity border and soft glow
  const isPoorOrWorse = targetAqi !== null && (isCpcb ? targetAqi > 200 : targetAqi > 100);

  const [animatedAqi, setAnimatedAqi] = useState(0);

  // Smooth count-up animation for the AQI number (0 -> target)
  useEffect(() => {
    if (targetAqi === null || !isDataSufficient) {
      return;
    }
    let animationFrameId: number;
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedAqi(Math.round(targetAqi * ease));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetAqi, isDataSufficient]);

  const displayAqi = !isDataSufficient || targetAqi === null ? null : animatedAqi;

  // Circular gauge geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.72
  const aqiRatio = (targetAqi !== null && isDataSufficient) ? Math.min(Math.max(targetAqi / 500, 0.05), 1) : 0;
  const targetOffset = (targetAqi !== null && isDataSufficient) ? circumference * (1 - aqiRatio) : circumference;

  // Rule 5: Never rely on color alone. Distinct icon for each level
  const renderSeverityIcon = () => {
    switch (activeCategory) {
      case "Good":
        return <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      case "Satisfactory":
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      case "Moderate":
        return <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      case "Poor":
      case "Unhealthy for Sensitive Groups":
        return <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      case "Very Poor":
      case "Unhealthy":
        return <AlertOctagon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      case "Severe":
      case "Very Unhealthy":
      case "Hazardous":
        return <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <Card
      elevated
      tilt3d={true}
      className="p-4 md:p-4.5 rounded-3xl relative overflow-hidden shrink-0 transition-all duration-300"
      style={{
        borderColor: isPoorOrWorse ? color : undefined,
        borderWidth: isPoorOrWorse ? "1px" : undefined,
        borderStyle: isPoorOrWorse ? "solid" : undefined,
        boxShadow: isPoorOrWorse
          ? `0 0 20px -2px ${color}30, 0 16px 40px -10px rgba(0, 0, 0, 0.7)`
          : undefined,
        background: `linear-gradient(135deg, ${color}0D 0%, rgba(18, 29, 42, 0.8) 100%)`,
      }}
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
        {/* Left: Live AQI Radial Arc Meter */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Subtle Outer Ring */}
          <div className="absolute inset-[-4px] md:inset-[-6px] rounded-full border border-[rgba(255,255,255,0.06)] pointer-events-none" />

          <svg
            className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 -rotate-90 transform"
            viewBox="0 0 130 130"
            aria-hidden="true"
          >
            {/* Background groove */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8.5"
              fill="none"
            />

            {/* Active meter stroke */}
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
            />
          </svg>

          {/* Central Glass Pod */}
          <div className="absolute inset-4 md:inset-5 rounded-full bg-[rgba(18,29,42,0.92)] border border-[rgba(255,255,255,0.12)] shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span
              className="text-3xl md:text-4xl font-extrabold tracking-tighter tabular-nums leading-none"
              style={{ color }}
            >
              {displayAqi !== null ? displayAqi : "--"}
            </span>
            <span className="text-xs font-bold text-[#A3B3C2] tracking-widest uppercase mt-0.5">
              {isCpcb ? "IN NAQI" : "US AQI"}
            </span>
          </div>
        </div>

        {/* Right: Health Impact & Dominant Smog Matrix */}
        <div className="flex-1 space-y-1.5 md:space-y-2 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center gap-1.5"
              style={{
                color: color,
                backgroundColor: badgeBg,
                borderColor: borderColor,
              }}
            >
              {renderSeverityIcon()}
              <span>{activeCategory}</span>
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#F2F6FA] leading-snug">
            {!isDataSufficient
              ? "Insufficient Telemetry for Composite Index"
              : targetAqi !== null && targetAqi > 200
              ? "Severe Smog Stagnation Active"
              : targetAqi !== null && targetAqi > 100
              ? "Elevated Atmospheric Particulates"
              : "Air Quality Within Standard Limits"}
          </h2>

          <p className="text-xs text-[#A3B3C2] leading-relaxed max-w-2xl">
            {!isDataSufficient
              ? (isCpcb
                  ? data.cpcbInsufficiencyReason || "CPCB NAQI requires at least 3 valid criteria pollutants including PM2.5 or PM10 with ≥16h of observations."
                  : "EPA NowCast requires at least 2 valid observations among the latest 3 clock hours.")
              : data.healthSummary}
          </p>

          {/* Dominant Pollutant vs WHO Reference Cap */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#8496A8]">Dominant:</span>
              <span className="font-semibold text-[#F2F6FA]">
                {data.primaryPollutant} (
                {data.primaryPollutant === "PM10"
                  ? data.pollutants.pm10?.value ?? 78
                  : data.pollutants.pm2_5?.value ?? data.nowCastConcentration}{" "}
                µg/m³)
              </span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-[rgba(255,255,255,0.1)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#8496A8]">WHO 24h Guideline:</span>
              <span className="font-semibold text-[#3DDC84]">15 µg/m³</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
