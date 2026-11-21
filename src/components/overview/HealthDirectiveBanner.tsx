"use client";

import React from "react";
import { AirQualityData } from "@/types/air-quality";
import { getAQIColor } from "@/lib/aqi-utils";
import { getCpcbColor } from "@/lib/cpcb-utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";

interface HealthDirectiveBannerProps {
  data: AirQualityData;
}

export function HealthDirectiveBanner({ data }: HealthDirectiveBannerProps) {
  const isCpcb = data.activeStandard === "INDIA_CPCB";
  const isMaskRequired = data.recommendations.maskRequired;
  const targetAqi = isCpcb ? data.indiaAqi : data.usAqi;
  const colorScheme = isCpcb ? getCpcbColor(targetAqi) : getAQIColor(targetAqi);
  const { color, bgColor, borderColor } = colorScheme;

  return (
    <Card
      elevated
      className="p-3.5 md:p-4 rounded-3xl flex items-center gap-3.5 shrink-0 transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${color}10 0%, rgba(18, 29, 42, 0.65) 100%)`,
        borderColor: isMaskRequired ? borderColor : undefined,
      }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1.5px_0_0_rgba(255,255,255,0.2)]"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: color,
        }}
        aria-hidden="true"
      >
        {isMaskRequired ? (
          <ShieldAlert className="w-5 h-5" style={{ color }} />
        ) : (
          <ShieldCheck className="w-5 h-5" style={{ color }} />
        )}
      </div>

      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#F2F6FA] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Activity className="w-3.5 h-3.5 text-[#4DB8FF]" />
            Health Directives ({isCpcb ? "India NAQI" : "US EPA"})
          </span>
          <Badge
            variant={isMaskRequired ? "danger" : "accent"}
            size="sm"
            className="text-xs py-0.5 px-2.5 font-semibold"
          >
            {isMaskRequired
              ? isCpcb
                ? "Respiratory Protection Advised"
                : "N95 / FFP2 Recommended"
              : "Standard Activity Safe"}
          </Badge>
          <span className="text-xs text-[#8496A8] hidden sm:inline">
            • Modelled advisory (Non-clinical)
          </span>
        </div>
        <p className="text-xs text-[#A3B3C2] leading-relaxed line-clamp-1 max-w-3xl">
          <strong className="text-[#F2F6FA] mr-1">{data.healthSummary}:</strong>
          {data.recommendations.general}
        </p>
      </div>
    </Card>
  );
}
