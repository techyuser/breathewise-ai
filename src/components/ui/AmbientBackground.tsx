"use client";

import React from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { getAQIColor } from "@/lib/aqi-utils";
import { getCpcbColor } from "@/lib/cpcb-utils";

export function AmbientBackground() {
  const { airData, activeStandard } = useAirQuality();

  const isCpcb = activeStandard === "INDIA_CPCB";
  const targetAqi = airData ? (isCpcb ? airData.indiaAqi : airData.usAqi) : null;
  const colorScheme = isCpcb ? getCpcbColor(targetAqi) : getAQIColor(targetAqi);
  const aqiColor = colorScheme.color; // AQI Severity color

  // Atmospheric smog shift: 0 when AQI <= 50 (Good), scaling gently up to ~0.18 at high AQI
  const aqiVal = targetAqi ?? 35;
  const isGood = aqiVal <= 50;
  const smogProgress = isGood ? 0 : Math.min(1, Math.max(0, (aqiVal - 50) / 350));
  const smogOpacity = smogProgress * 0.18;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Base Neutral Night-Slate Foundation */}
      <div className="absolute inset-0 bg-[#0A1118]" />

      {/* Subtle Mobile Ambient Glow */}
      <div
        className="absolute inset-0 md:hidden transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${aqiColor}15 0%, transparent 65%)`,
        }}
      />

      {/* Refined Atmospheric Depth Halos (Desktop) */}
      <div
        className="hidden md:block absolute top-[-60px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${aqiColor}18 0%, rgba(77, 184, 255, 0.05) 45%, transparent 70%)`,
        }}
      />

      {/* Subtle Lower Ambient Depth */}
      <div
        className="hidden md:block absolute bottom-[-80px] right-[10%] w-[500px] h-[500px] rounded-full blur-[110px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${aqiColor}0E 0%, transparent 70%)`,
        }}
      />

      {/* Rule 4: Clean slate when AQI is Good, shifting toward a subtle hazy warm-grey/brown overlay as AQI rises */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out"
        style={{
          opacity: smogOpacity,
          background: "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(120, 95, 70, 0.35) 0%, rgba(70, 55, 42, 0.15) 50%, transparent 80%)",
        }}
      />

      {/* Clean Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,17,24,0.75)_100%)] pointer-events-none" />
    </div>
  );
}
