"use client";

import React from "react";
import { InversionRisk } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CloudFog } from "lucide-react";
import { motion } from "motion/react";

interface SmogInversionAlertProps {
  inversion: InversionRisk;
}

export function SmogInversionAlert({ inversion }: SmogInversionAlertProps) {
  const isExtreme = inversion.level === "Extreme";
  const isHigh = inversion.level === "High";

  return (
    <Card
      elevated
      className={`p-5 rounded-3xl relative ${
        isExtreme || isHigh
          ? "bg-[rgba(248,113,113,0.06)] border-[rgba(248,113,113,0.25)]"
          : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isExtreme || isHigh
                ? "bg-[rgba(248,113,113,0.15)] text-[#F87171] border border-[rgba(248,113,113,0.3)]"
                : "bg-[rgba(0,214,154,0.12)] text-[#00D69A] border border-[rgba(0,214,154,0.25)]"
            }`}
          >
            <CloudFog className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#F5F8F6]">
                Winter Atmospheric Inversion Risk
              </h4>
              <Badge
                variant={isExtreme ? "danger" : isHigh ? "warning" : "accent"}
                size="sm"
                className="backdrop-blur-md"
              >
                {inversion.level} Alert
              </Badge>
            </div>
            <p className="text-xs text-[#98A9A1] leading-relaxed max-w-2xl">
              {inversion.description}
            </p>
          </div>
        </div>

        {/* Inversion probability gauge */}
        <div className="shrink-0 flex items-center gap-4 bg-[rgba(6,16,12,0.55)] p-3 rounded-2xl border border-[rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#98A9A1] block font-semibold">
              Smog Trap Index
            </span>
            <div className="text-xl font-bold text-[#F5F8F6] tabular-nums">
              {inversion.trappedSmogProbability}%
            </div>
          </div>
          <div className="w-24 bg-[rgba(14,34,26,0.6)] rounded-full h-2 overflow-hidden border border-[rgba(255,255,255,0.06)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${inversion.trappedSmogProbability}%` }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 24,
              }}
              className={`h-full rounded-full ${
                isExtreme
                  ? "bg-[#F87171]"
                  : isHigh
                  ? "bg-[#FACC15]"
                  : "bg-[#00D69A]"
              }`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
