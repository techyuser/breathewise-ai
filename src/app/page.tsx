"use client";

import React from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { HeroAqiCard } from "@/components/overview/HeroAqiCard";
import { OverviewMetricsGrid } from "@/components/overview/OverviewMetricsGrid";
import { HealthDirectiveBanner } from "@/components/overview/HealthDirectiveBanner";
import { TrendChart } from "@/components/overview/TrendChart";
import { QuickInsights } from "@/components/overview/QuickInsights";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Sparkles } from "lucide-react";

export default function OverviewPage() {
  const { airData, loading, error, refreshData, activeStandard } = useAirQuality();

  if (loading && !airData) {
    return (
      <PageTransition className="py-12">
        <LoadingState
          label="Interrogating atmospheric model grid..."
          sublabel="Retrieving Copernicus CAMS assimilation & meteorological layers from Open-Meteo"
        />
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

  if (!airData) {
    return null;
  }

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const isCpcb = activeStandard === "INDIA_CPCB";

  return (
    <PageTransition className="space-y-3 md:space-y-3.5 pb-10">
      {/* 1. Welcome and Location */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#00D69A] mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{greeting}</span>
            <span className="text-[#64786E]">•</span>
            <span className="text-[#98A9A1] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#00D69A]" />
              {airData.city.name}{airData.city.country ? `, ${airData.city.country}` : ""}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F5F8F6]">
            Urban Air Intelligence
          </h1>
          <p className="text-xs text-[#98A9A1] mt-0.5">
            Atmospheric inversion modeling, particulate matrix, and clinical directives.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isCpcb ? "accent" : "subtle"} size="sm">
            Calculation: {isCpcb ? "India CPCB NAQI" : "US EPA NowCast"}
          </Badge>
          <Badge variant="outline" size="sm">
            Source: Copernicus CAMS Grid
          </Badge>
          {airData.cacheStatus && (
            <Badge variant="subtle" size="sm" className="text-[10px] hidden sm:inline-flex">
              Cache: {airData.cacheStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* 2. One Prominent AQI Hero Card */}
      <HeroAqiCard data={airData} />

      {/* 3. AI Health Recommendation Directive — Right after AQI Hero Card */}
      <HealthDirectiveBanner data={airData} />

      {/* 4. PM2.5, PM10 & Weather Grid (Temp, Humidity, Wind) — Completely visible above fold */}
      <OverviewMetricsGrid data={airData} />

      {/* 5. 24-Hour Trend Chart — Available on Scroll with Historical & Forecast Tabs */}
      <TrendChart
        historicalData={airData.hourlyHistorical}
        forecastData={airData.hourlyForecast}
      />

      {/* 6. Compact Daily Actions — Available on Scroll */}
      <QuickInsights data={airData} />
    </PageTransition>
  );
}
