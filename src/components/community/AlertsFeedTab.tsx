"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Radio, MapPin, ThumbsUp, Camera, Building, Check, Copy } from "lucide-react";
import type { CleanAirRefuge, CommunityAlert } from "@/components/community/community-data";

interface AlertsFeedTabProps {
  alerts: CommunityAlert[];
  filteredAlerts: CommunityAlert[];
  filterType: string;
  copiedId: string | null;
  refuges: CleanAirRefuge[];
  onFilterChange: (cat: string) => void;
  onVerifyAlert: (id: string) => void;
  onCopyRefuge: (refuge: CleanAirRefuge) => void;
}

const ALERT_FILTERS = ["All", "Biomass Burning", "Construction Dust", "Severe Smog Pocket"];

/**
 * Displays citizen-submitted environmental incident observations alongside
 * verified HEPA-filtered clean air community refuges.
 */
export function AlertsFeedTab({
  filteredAlerts,
  filterType,
  copiedId,
  refuges,
  onFilterChange,
  onVerifyAlert,
  onCopyRefuge,
}: AlertsFeedTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-wider text-[#A3B3C2] uppercase flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#FACC15] animate-pulse" />
            Live Incident Stream ({filteredAlerts.length})
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ALERT_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterChange(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === cat
                    ? "bg-[rgba(77,184,255,0.2)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] font-semibold"
                    : "bg-[rgba(14,23,34,0.5)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              elevated
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        alert.severity === "Severe"
                          ? "danger"
                          : alert.severity === "High"
                          ? "warning"
                          : "subtle"
                      }
                      size="sm"
                      className="text-xs"
                    >
                      {alert.type}
                    </Badge>
                    <span className="text-xs text-[#8496A8]">•</span>
                    <span className="text-xs text-[#A3B3C2]">{alert.timeAgo}</span>
                    <span className="text-xs text-[#8496A8]">•</span>
                    <span className="text-xs text-[#4DB8FF]">{alert.distance}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F2F6FA] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                    {alert.location}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => onVerifyAlert(alert.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    alert.verifiedByUser
                      ? "bg-[rgba(77,184,255,0.2)] border-[#4DB8FF] text-[#4DB8FF]"
                      : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.08)]"
                  }`}
                  title="Verify this observation"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{alert.verifications}</span>
                </button>
              </div>

              <p className="text-xs text-[#A3B3C2] leading-relaxed">{alert.description}</p>

              {alert.hasPhoto && (
                <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-xs text-[#8496A8]">
                  <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Citizen attached photo verification telemetry</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-[#A3B3C2] uppercase flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#4DB8FF]" />
            Verified Clean Air Refuges
          </h3>
          <Badge variant="accent" size="sm">
            HEPA Safe
          </Badge>
        </div>

        <div className="space-y-3">
          {refuges.map((refuge) => (
            <Card
              key={refuge.id}
              elevated
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#F2F6FA]">{refuge.name}</h4>
                  <p className="text-xs text-[#A3B3C2] mt-0.5">{refuge.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-[#4DB8FF]">{refuge.indoorAqi}</div>
                  <div className="text-xs uppercase tracking-wider text-[#8496A8]">Indoor AQI</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.06)] text-xs">
                <span className="text-[#8496A8]">{refuge.openHours}</span>
                <button
                  type="button"
                  onClick={() => onCopyRefuge(refuge)}
                  className="text-xs font-semibold text-[#4DB8FF] hover:text-[#7CCBFF] flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === refuge.id ? (
                    <>
                      <Check className="w-3 h-3 text-[#4DB8FF]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
