"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Compass, X } from "lucide-react";
import type { CityLocation } from "@/types/air-quality";
import type { CommunityAlert } from "@/components/community/community-data";

interface RadarHotspotMapProps {
  selectedCity: CityLocation;
  alerts: CommunityAlert[];
}

const RADAR_OFFSETS = [
  { top: "25%", left: "68%" },
  { top: "65%", left: "32%" },
  { top: "35%", left: "28%" },
  { top: "72%", left: "75%" },
];

/**
 * Interactive proximity radar canvas plotting citizen smoke observations around
 * the user's selected hub with accessible inline hotspot inspection.
 */
export function RadarHotspotMap({ selectedCity, alerts }: RadarHotspotMapProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<CommunityAlert | null>(null);

  return (
    <Card
      elevated
      className="p-5 md:p-6 rounded-3xl space-y-4 border border-[rgba(77,184,255,0.2)] bg-[rgba(9,18,14,0.8)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#F2F6FA] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#4DB8FF]" />
            Micro-Climate Hotspot Radar: {selectedCity.name}
          </h3>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Spatial distribution of citizen-reported plumes and sensor cross-correlations
          </p>
        </div>
        <Badge variant="subtle" size="sm">
          Coordinates: {selectedCity.lat.toFixed(2)}°N, {selectedCity.lon.toFixed(2)}°E
        </Badge>
      </div>

      <div className="relative w-full h-80 rounded-2xl bg-[rgba(10,17,24,0.95)] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
        <div className="absolute w-72 h-72 rounded-full border border-[rgba(77,184,255,0.15)] pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full border border-[rgba(77,184,255,0.2)] pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-[rgba(77,184,255,0.3)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(77,184,255,0.06)_0%,transparent_75%)] pointer-events-none" />
        <div className="absolute w-full h-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />
        <div className="absolute h-full w-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-[#4DB8FF] border-2 border-white shadow-[0_0_16px_#4DB8FF] animate-ping" />
          <span className="text-xs font-bold text-[#F2F6FA] bg-[rgba(0,0,0,0.7)] px-2 py-0.5 rounded-full mt-1 border border-[rgba(255,255,255,0.1)]">
            You ({selectedCity.name})
          </span>
        </div>

        {alerts.map((item, idx) => {
          const pos = RADAR_OFFSETS[idx % RADAR_OFFSETS.length];
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Inspect ${item.type} hotspot at ${item.location}`}
              className="absolute cursor-pointer group z-20 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] rounded-full"
              style={{ top: pos.top, left: pos.left }}
              onClick={() => setSelectedHotspot(item)}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-transform group-hover:scale-125 ${
                  item.severity === "Severe"
                    ? "bg-[#F87171] border-white shadow-[0_0_12px_#F87171]"
                    : "bg-[#FACC15] border-white shadow-[0_0_12px_#FACC15]"
                }`}
              />
              <div className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[rgba(10,22,17,0.95)] border border-[rgba(255,255,255,0.2)] rounded-xl px-2.5 py-1 text-xs text-[#F2F6FA] shadow-xl z-30">
                <span className="font-bold">{item.type}</span>: {item.location}
              </div>
            </button>
          );
        })}

        {selectedHotspot && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:w-80 bg-[rgba(14,23,34,0.95)] border border-[rgba(77,184,255,0.35)] rounded-2xl p-3 text-xs text-[#F2F6FA] shadow-xl z-30 space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant={selectedHotspot.severity === "Severe" ? "danger" : "warning"} size="sm">
                {selectedHotspot.type} • {selectedHotspot.severity}
              </Badge>
              <button
                type="button"
                aria-label="Close hotspot details"
                onClick={() => setSelectedHotspot(null)}
                className="text-[#8496A8] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-bold">{selectedHotspot.location}</div>
            <p className="text-[#A3B3C2] leading-snug">{selectedHotspot.description}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#A3B3C2] pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
            <span>Severe Smog / Fire</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
            <span>Construction Dust</span>
          </span>
        </div>
        <span>Click any marker to inspect incident metadata</span>
      </div>
    </Card>
  );
}
