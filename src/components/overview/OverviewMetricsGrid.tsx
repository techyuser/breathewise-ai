"use client";

import React, { useState } from "react";
import { AirQualityData } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { Thermometer, Droplets, Wind, ChevronDown, ChevronUp } from "lucide-react";
import { motion, Variants, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/Badge";

interface OverviewMetricsGridProps {
  data: AirQualityData;
}

export function OverviewMetricsGrid({ data }: OverviewMetricsGridProps) {
  const { temperature, humidity, windSpeed, pollutants, weather } = data;
  const pm25 = pollutants.pm2_5;
  const pm10 = pollutants.pm10;
  const [showGases, setShowGases] = useState(false);

  const isStagnant = windSpeed < 10;
  const isHighMoisture = humidity > 60;
  const isCoolInversion = temperature < 18;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="space-y-3 shrink-0">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-3.5 items-stretch"
      >
        {/* 1. PM2.5 Fine Particulate */}
        <motion.div variants={itemVariants} className="h-full">
          <Card
            interactive
            elevated
            className="p-3.5 md:p-4 rounded-3xl flex flex-col justify-between space-y-2 h-full"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-[#F2F6FA]">PM2.5</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[rgba(255,92,92,0.12)] border border-[rgba(255,92,92,0.3)] text-[#FF5C5C]">
                {pm25?.status ?? "Elevated"}
              </span>
            </div>

            <div className="py-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#F2F6FA] tabular-nums">
                  {pm25?.value ?? data.nowCastConcentration}
                </span>
                <span className="text-xs text-[#A3B3C2]">µg/m³</span>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                Fine inhalable particulates
              </p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>WHO Cap</span>
                <span className="text-[#3DDC84]">15 µg/m³</span>
              </div>
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5C5C] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((pm25?.value ?? 50) / 150) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 2. PM10 Coarse Particulate */}
        <motion.div variants={itemVariants} className="h-full">
          <Card
            interactive
            elevated
            className="p-3.5 md:p-4 rounded-3xl flex flex-col justify-between space-y-2 h-full"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-[#F2F6FA]">PM10</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[rgba(255,210,63,0.12)] border border-[rgba(255,210,63,0.3)] text-[#FFD23F]">
                {pm10?.status ?? "Moderate"}
              </span>
            </div>

            <div className="py-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#F2F6FA] tabular-nums">
                  {pm10?.value ?? 120}
                </span>
                <span className="text-xs text-[#A3B3C2]">µg/m³</span>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                Coarse dust & smoke
              </p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>WHO Cap</span>
                <span className="text-[#3DDC84]">45 µg/m³</span>
              </div>
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFD23F] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((pm10?.value ?? 60) / 200) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 3. Surface Temperature & Weather Condition */}
        <motion.div variants={itemVariants} className="h-full">
          <Card
            interactive
            elevated
            className="p-3.5 md:p-4 rounded-3xl flex flex-col justify-between space-y-2 h-full"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#4DB8FF]" />
                <span className="text-xs font-semibold text-[#F2F6FA]">Surface Temp</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isCoolInversion
                    ? "bg-[rgba(77,184,255,0.12)] border-[rgba(77,184,255,0.3)] text-[#4DB8FF]"
                    : "bg-[rgba(77,184,255,0.12)] border-[rgba(77,184,255,0.3)] text-[#4DB8FF]"
                }`}
              >
                {weather?.description || (isCoolInversion ? "Inversion" : "Normal")}
              </span>
            </div>

            <div className="py-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#F2F6FA] tabular-nums">
                  {temperature}
                </span>
                <span className="text-xs text-[#A3B3C2]">°C</span>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                Feels like {weather?.feelsLike ?? temperature}°C • {weather?.surfacePressure ?? 1013} hPa
              </p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>0°C</span>
                <span>40°C</span>
              </div>
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4DB8FF] to-[#3DDC84] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, (temperature / 40) * 100))}%` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 4. Relative Humidity (Weather) */}
        <motion.div variants={itemVariants} className="h-full">
          <Card
            interactive
            elevated
            className="p-3.5 md:p-4 rounded-3xl flex flex-col justify-between space-y-2 h-full"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#4DB8FF]" />
                <span className="text-xs font-semibold text-[#F2F6FA]">Humidity</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isHighMoisture
                    ? "bg-[rgba(255,92,92,0.12)] border-[rgba(255,92,92,0.3)] text-[#FF5C5C]"
                    : "bg-[rgba(77,184,255,0.12)] border-[rgba(77,184,255,0.3)] text-[#4DB8FF]"
                }`}
              >
                {isHighMoisture ? "Moist" : "Dry Air"}
              </span>
            </div>

            <div className="py-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#F2F6FA] tabular-nums">
                  {humidity}
                </span>
                <span className="text-xs text-[#A3B3C2]">%</span>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                {isHighMoisture ? "Aerosol swelling active" : "Low particle moisture"}
              </p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>0%</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4DB8FF] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, humidity))}%` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 5. Wind & Dispersion (Weather) */}
        <motion.div variants={itemVariants} className="col-span-2 sm:col-span-1 h-full">
          <Card
            interactive
            elevated
            className="p-3.5 md:p-4 rounded-3xl flex flex-col justify-between space-y-2 h-full"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#4DB8FF]" />
                <span className="text-xs font-semibold text-[#F2F6FA]">Wind Speed</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isStagnant
                    ? "bg-[rgba(255,210,63,0.12)] border-[rgba(255,210,63,0.3)] text-[#FFD23F]"
                    : "bg-[rgba(77,184,255,0.12)] border-[rgba(77,184,255,0.3)] text-[#4DB8FF]"
                }`}
              >
                {isStagnant ? "Stagnant" : "Active"}
              </span>
            </div>

            <div className="py-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-[#F2F6FA] tabular-nums">
                  {windSpeed}
                </span>
                <span className="text-xs text-[#A3B3C2]">km/h</span>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                {isStagnant ? "Calm air pools emissions" : "Steady wind clears smog"}
              </p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>Dir: {weather?.windDirection ?? 180}°</span>
                <span>30+ km/h</span>
              </div>
              <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4DB8FF] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, (windSpeed / 30) * 100))}%` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Expandable Trace Gas Matrix (NO2, CO, O3, SO2) */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setShowGases(!showGases)}
          aria-expanded={showGases}
          className="flex items-center gap-1.5 text-xs text-[#A3B3C2] hover:text-[#F2F6FA] py-1.5 px-3.5 rounded-full bg-[rgba(14,23,34,0.6)] hover:bg-[rgba(18,29,42,0.8)] border border-[rgba(255,255,255,0.08)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
        >
          <span>{showGases ? "Hide Atmospheric Gas Matrix" : "View NO₂, CO, O₃ & SO₂ Gas Matrix"}</span>
          {showGases ? <ChevronUp className="w-3.5 h-3.5 text-[#4DB8FF]" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showGases && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* NO2 */}
                <Card elevated className="p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F2F6FA]">NO₂ (Nitrogen Dioxide)</span>
                    <Badge size="sm" variant={pollutants.nitrogen_dioxide?.status === "High" ? "danger" : "accent"}>
                      {pollutants.nitrogen_dioxide?.status ?? "Safe"}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-[#F2F6FA] tabular-nums">
                    {pollutants.nitrogen_dioxide?.value ?? 38} <span className="text-xs text-[#A3B3C2]">µg/m³</span>
                  </div>
                  <div className="text-xs text-[#8496A8]">WHO Limit: 25 µg/m³ (Vehicular)</div>
                </Card>

                {/* Ozone */}
                <Card elevated className="p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F2F6FA]">O₃ (Ground Ozone)</span>
                    <Badge size="sm" variant={pollutants.ozone?.status === "High" ? "danger" : "accent"}>
                      {pollutants.ozone?.status ?? "Safe"}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-[#F2F6FA] tabular-nums">
                    {pollutants.ozone?.value ?? 42} <span className="text-xs text-[#A3B3C2]">µg/m³</span>
                  </div>
                  <div className="text-xs text-[#8496A8]">WHO Limit: 100 µg/m³ (Photochemical)</div>
                </Card>

                {/* CO */}
                <Card elevated className="p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F2F6FA]">CO (Carbon Monoxide)</span>
                    <Badge size="sm" variant="accent">Safe</Badge>
                  </div>
                  <div className="text-xl font-bold text-[#F2F6FA] tabular-nums">
                    {pollutants.carbon_monoxide?.value ?? 460} <span className="text-xs text-[#A3B3C2]">µg/m³</span>
                  </div>
                  <div className="text-xs text-[#8496A8]">WHO Limit: 4000 µg/m³ (Incomplete burn)</div>
                </Card>

                {/* SO2 */}
                <Card elevated className="p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F2F6FA]">SO₂ (Sulphur Dioxide)</span>
                    <Badge size="sm" variant="accent">Safe</Badge>
                  </div>
                  <div className="text-xl font-bold text-[#F2F6FA] tabular-nums">
                    {pollutants.sulphur_dioxide?.value ?? 12} <span className="text-xs text-[#A3B3C2]">µg/m³</span>
                  </div>
                  <div className="text-xs text-[#8496A8]">WHO Limit: 40 µg/m³ (Industrial)</div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
