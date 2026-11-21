"use client";

import React, { useState } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PRESET_CITIES } from "@/lib/open-meteo";
import { ShieldCheck, AlertCircle, Database } from "lucide-react";
import { motion } from "motion/react";

export default function AirQualityPage() {
  const { airData, loading, error, refreshData, setSelectedCity } = useAirQuality();
  const [selectedPollutant, setSelectedPollutant] = useState<string>("pm2_5");

  if (loading && !airData) {
    return (
      <PageTransition className="py-12">
        <LoadingState label="Loading comprehensive atmospheric diagnostics..." />
      </PageTransition>
    );
  }

  if (error && !airData) {
    return (
      <PageTransition className="py-12">
        <ErrorState message={error} onRetry={refreshData} />
      </PageTransition>
    );
  }

  if (!airData) return null;

  const activePollutant = airData.pollutants[selectedPollutant] || airData.pollutants.pm2_5;

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F6FA]">
            Atmospheric Diagnostics & Smog Science
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Comprehensive multi-pollutant chemistry and numerical model assimilation for {airData.city.name}.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="accent" dot>
            CAMS Grid
          </Badge>
          <Badge variant="subtle">
            WHO 2021 AQG Limits
          </Badge>
          <Badge variant="outline">
            US EPA NowCast
          </Badge>
        </div>
      </div>

      {/* Main Grid: Interactive Pollutant Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pollutant Selector List */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8496A8] px-1">
            Measured Parameters
          </div>
          {Object.entries(airData.pollutants).map(([key, item]) => {
            const isSelected = selectedPollutant === key;
            const isHigh = item.status === "High" || item.status === "Severe";
            return (
              <motion.button
                whileHover={{ x: 2 }}
                key={key}
                onClick={() => setSelectedPollutant(key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between backdrop-blur-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] ${
                  isSelected
                    ? "bg-[rgba(77,184,255,0.14)] border-[rgba(77,184,255,0.35)] shadow-[0_4px_16px_rgba(77,184,255,0.15)]"
                    : "bg-[rgba(14,23,34,0.55)] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(18,29,42,0.7)]"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F2F6FA]">
                      {item.chemicalFormula}
                    </span>
                    <span className="text-xs text-[#A3B3C2]">{item.name}</span>
                  </div>
                  <div className="text-xs text-[#8496A8]">
                    WHO Cap: {item.whoLimit} {item.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-[#F2F6FA] tabular-nums">
                    {item.value} <span className="text-xs text-[#A3B3C2]">{item.unit}</span>
                  </div>
                  <Badge
                    size="sm"
                    variant={isHigh ? "danger" : item.status === "Elevated" ? "warning" : "accent"}
                  >
                    {item.status}
                  </Badge>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right 2 Columns: Detailed Pollutant Analysis */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            elevated
            className="p-6 rounded-3xl space-y-6"
          >
            <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#F2F6FA]">
                    {activePollutant.chemicalFormula}
                  </span>
                  <span className="text-base text-[#A3B3C2]">({activePollutant.name})</span>
                </div>
                <p className="text-xs text-[#A3B3C2] mt-1">
                  {activePollutant.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-3xl font-bold text-[#4DB8FF] tabular-nums">
                  {activePollutant.value}
                </span>
                <span className="text-xs text-[#A3B3C2] block">{activePollutant.unit}</span>
              </div>
            </div>

            {/* Threshold progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A3B3C2]">Concentration vs WHO 24h Guideline Limit</span>
                <span className="font-semibold text-[#F2F6FA]">
                  {activePollutant.percentageOfLimit}% of WHO threshold
                </span>
              </div>
              <div className="w-full bg-[rgba(14,23,34,0.7)] rounded-full h-2.5 p-0.5 border border-[rgba(255,255,255,0.06)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, activePollutant.percentageOfLimit)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      activePollutant.percentageOfLimit > 200
                        ? "#FF5C5C"
                        : activePollutant.percentageOfLimit > 100
                        ? "#FF9F45"
                        : "#3DDC84",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#8496A8]">
                <span>0 {activePollutant.unit} (Clean)</span>
                <span>WHO Cap: {activePollutant.whoLimit} {activePollutant.unit}</span>
                <span>Elevated Hazard</span>
              </div>
            </div>

            {/* Health Implications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-[rgba(18,29,42,0.5)] border border-[rgba(255,255,255,0.06)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF5C5C]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Physiological Vulnerability</span>
                </div>
                <p className="text-xs text-[#A3B3C2] leading-relaxed">
                  Prolonged exposure promotes systemic inflammation, alveolar capillary diffusion, and triggers bronchial asthma flare-ups.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[rgba(18,29,42,0.5)] border border-[rgba(255,255,255,0.06)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC84]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Engineered Countermeasure</span>
                </div>
                <p className="text-xs text-[#A3B3C2] leading-relaxed">
                  True HEPA H13 filtration (EN 1822 compliant) captures fine particulates down to 0.3 microns. Electrostatically charged N95 respirators filter airborne particulates.
                </p>
              </div>
            </div>
          </Card>

          {/* Regional Smog Comparison */}
          <Card elevated className="p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F2F6FA]">
                Benchmark Across Global Winter Smog Metros
              </h4>
              <span className="text-xs text-[#8496A8]">Click city to switch active model</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {PRESET_CITIES.slice(0, 5).map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] ${
                    city.id === airData.city.id
                      ? "bg-[rgba(77,184,255,0.12)] border-[#4DB8FF] text-[#4DB8FF] shadow-sm"
                      : "bg-[rgba(14,23,34,0.45)] border-[rgba(255,255,255,0.06)] text-[#A3B3C2] hover:text-[#F2F6FA]"
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{city.name}</div>
                  <div className="text-xs text-[#8496A8]">{city.country}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Methodology & Transparency Disclosure Card */}
          <Card elevated className="p-5 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4DB8FF]">
              <Database className="w-4 h-4" />
              <span>Data Provenance & CPCB / CAMS Compliance</span>
            </div>
            <p className="text-xs text-[#A3B3C2] leading-relaxed">
              <strong>Atmospheric Data Source:</strong> {airData.source}
            </p>
            <p className="text-xs text-[#A3B3C2] leading-relaxed">
              <strong>Active Index Standard:</strong> {airData.calculationStandard}
            </p>
            <p className="text-xs text-[#8496A8] leading-relaxed">
              <strong>Transparency Note:</strong> {airData.cpcbDisclaimer}
            </p>
            <div className="text-xs text-[#8496A8] pt-1 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <span>Model Run: {airData.modelRunTimestamp}</span>
              <span>Client Sync: {airData.lastUpdated}</span>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
