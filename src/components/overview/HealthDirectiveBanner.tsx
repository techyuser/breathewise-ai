"use client";

import React from "react";
import { AirQualityData } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";

interface HealthDirectiveBannerProps {
  data: AirQualityData;
}

export function HealthDirectiveBanner({ data }: HealthDirectiveBannerProps) {
  const isMaskRequired = data.recommendations.maskRequired;

  return (
    <Card
      elevated
      className="p-3.5 md:p-4 rounded-3xl flex items-center gap-3.5 shrink-0"
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1.5px_0_0_rgba(255,255,255,0.2)] ${
          isMaskRequired
            ? "bg-[rgba(248,113,113,0.15)] border-[rgba(248,113,113,0.35)] text-[#F87171]"
            : "bg-[rgba(0,214,154,0.15)] border-[rgba(0,214,154,0.35)] text-[#00D69A]"
        }`}
      >
        {isMaskRequired ? (
          <ShieldAlert className="w-5 h-5 text-[#F87171]" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-[#00D69A]" />
        )}
      </div>

      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#F5F8F6] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#00D69A]" />
            AI Health Recommendation
          </span>
          <Badge
            variant={isMaskRequired ? "danger" : "accent"}
            size="sm"
            className="text-[10px] py-0.5 px-2.5"
          >
            {isMaskRequired ? "N95 / FFP2 Recommended" : "Standard Protection"}
          </Badge>
        </div>
        <p className="text-xs text-[#98A9A1] leading-relaxed line-clamp-1 max-w-3xl">
          {data.healthSummary}
        </p>
      </div>
    </Card>
  );
}
