"use client";

import React from "react";
import Link from "next/link";
import { AirQualityData } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { Sparkles, Clock, DoorClosed, Dumbbell, ShieldCheck, ArrowRight } from "lucide-react";
import { useAirQuality } from "@/context/AirQualityContext";

interface QuickInsightsProps {
  data: AirQualityData;
}

export function QuickInsights({ data }: QuickInsightsProps) {
  const { activeStandard } = useAirQuality();
  const isCpcb = activeStandard === "INDIA_CPCB";
  const aqiValue = isCpcb ? data.indiaAqi : data.usAqi;
  const isHighSmog = aqiValue !== null ? (isCpcb ? aqiValue > 200 : aqiValue > 150) : false;

  const actions = [
    {
      title: "Optimal Outdoor Window",
      status: isHighSmog ? "1:00 PM – 3:30 PM" : "Anytime Before 8:00 PM",
      desc: isHighSmog
        ? "Midday solar warmth temporarily lifts ground smog pool."
        : "Low ground pollution with steady wind clearing emissions.",
      icon: Clock,
      color: "#4DB8FF",
      href: "/planner",
    },
    {
      title: "Home Ventilation",
      status: isHighSmog ? "Windows Sealed" : "Natural Airing Permitted",
      desc: data.recommendations.ventilation,
      icon: DoorClosed,
      color: isHighSmog ? "#FF5C5C" : "#3DDC84",
      href: "/indoor",
    },
    {
      title: "Physical Exercise",
      status: isHighSmog ? "Indoor Cardio Only" : "Safe Outdoors",
      desc: data.recommendations.outdoorActivity,
      icon: Dumbbell,
      color: isHighSmog ? "#FF9F45" : "#3DDC84",
      href: "/planner",
    },
    {
      title: "Vulnerable Groups",
      status: "Asthma & Pediatric Guard",
      desc: data.recommendations.vulnerable,
      icon: ShieldCheck,
      color: "#4DB8FF",
      href: "/assistant",
    },
  ];

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-[#F2F6FA] uppercase flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4DB8FF]" />
          Compact Daily Actions
        </h3>
        <span className="text-xs text-[#A3B3C2]">
          Diurnal guidance for today
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {actions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href} className="block group">
              <Card
                interactive
                elevated
                className="p-4 rounded-3xl space-y-2 flex flex-col justify-between h-full"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                      <span className="text-xs font-semibold text-[#F2F6FA]">
                        {item.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8496A8] group-hover:text-[#4DB8FF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div
                    className="text-xs font-bold tracking-tight"
                    style={{ color: item.color }}
                  >
                    {item.status}
                  </div>
                </div>
                <p className="text-xs text-[#A3B3C2] leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
