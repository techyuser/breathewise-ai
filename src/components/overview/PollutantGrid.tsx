"use client";

import React from "react";
import Link from "next/link";
import { PollutantDetail } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface PollutantGridProps {
  pollutants: Record<string, PollutantDetail>;
}

export function PollutantGrid({ pollutants }: PollutantGridProps) {
  const list = Object.values(pollutants);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-xs font-semibold tracking-wider text-[#F5F8F6] uppercase">
          Key Atmospheric Pollutant Concentrations
        </h3>
        <span className="text-xs text-[#98A9A1]">
          Modelled estimates compared against WHO 24-hr Air Quality Guideline Limits (AQG)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {list.map((item, idx) => {
          const isHigh = item.status === "High" || item.status === "Severe";
          const isElevated = item.status === "Elevated";

          return (
            <Link
              key={item.code}
              href="/air-quality"
              className="block group"
            >
              <Card
                interactive
                elevated
                className="p-4 rounded-3xl flex flex-col justify-between space-y-3 h-full"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#F5F8F6] tracking-tight group-hover:text-[#00D69A] transition-colors">
                      {item.chemicalFormula}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-[#64786E] group-hover:text-[#00D69A] transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                  <Badge
                    size="sm"
                    variant={isHigh ? "danger" : isElevated ? "warning" : "accent"}
                  >
                    {item.status}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-[#F5F8F6] tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-[10px] text-[#98A9A1]">{item.unit}</span>
                  </div>
                  <div className="text-[11px] text-[#98A9A1] mt-0.5 truncate" title={item.name}>
                    {item.name}
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] space-y-1">
                  <div className="flex justify-between text-[10px] text-[#64786E]">
                    <span>WHO 24h Cap</span>
                    <span className="font-medium text-[#98A9A1]">
                      {item.whoLimit} {item.unit}
                    </span>
                  </div>
                  {/* Visual bar against WHO limit */}
                  <div className="w-full bg-[rgba(7,20,16,0.8)] rounded-full h-1.5 overflow-hidden border border-[rgba(255,255,255,0.05)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.percentageOfLimit)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: isHigh ? "#F87171" : isElevated ? "#FB923C" : "#00D69A",
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
