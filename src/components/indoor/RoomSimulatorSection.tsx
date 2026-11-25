"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Droplets, Power, Info } from "lucide-react";

export interface RoomSensor {
  id: string;
  name: string;
  estimatedAqi: number;
  pm2_5: number;
  purifierActive: boolean;
  filterLife: number;
}

interface RoomSimulatorSectionProps {
  rooms: RoomSensor[];
  onTogglePurifier: (id: string) => void;
}

/**
 * Interactive per-room infiltration & purifier simulator displaying estimated AQI,
 * PM2.5 mass concentration, filter life, and engineering model disclosures.
 */
export function RoomSimulatorSection({
  rooms,
  onTogglePurifier,
}: RoomSimulatorSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-base font-bold text-[#F2F6FA]">
            Interactive Room Model & Purifier Simulation
          </h2>
        </div>
        <Badge
          variant="subtle"
          size="sm"
          className="border-[rgba(56,189,248,0.3)] text-[#38BDF8] bg-[rgba(56,189,248,0.08)]"
        >
          Estimated Indoor AQI (Room Model)
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card
            key={room.id}
            elevated
            hoverEffect
            className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,29,42,0.65)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F2F6FA]">{room.name}</span>
                <div className="text-xs text-[#8496A8] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  <span>Estimated Infiltration Model</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTogglePurifier(room.id)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  room.purifierActive
                    ? "bg-[rgba(77,184,255,0.2)] border-[#4DB8FF] text-[#4DB8FF]"
                    : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#8496A8]"
                }`}
                title={room.purifierActive ? "Turn Purifier OFF" : "Turn Purifier ON"}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-3xl font-extrabold text-[#F2F6FA] tracking-tight">
                  {room.estimatedAqi}
                </div>
                <div className="text-xs uppercase tracking-wider text-[#A3B3C2]">Indoor Est. AQI</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#4DB8FF]">{room.pm2_5} µg/m³</div>
                <div className="text-xs uppercase tracking-wider text-[#8496A8]">PM2.5 Conc.</div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-[#A3B3C2]">
                <span>HEPA Filter Life</span>
                <span className="font-semibold text-[#F2F6FA]">{room.filterLife}%</span>
              </div>
              <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4DB8FF] rounded-full"
                  style={{ width: `${room.filterLife}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-[rgba(10,22,17,0.5)] border border-[rgba(255,255,255,0.06)] flex items-start gap-2.5 text-xs text-[#A3B3C2] leading-relaxed">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <span>
          <strong>Indoor Engineering Model Assumptions:</strong> Room particulate concentrations and
          purifier reductions are illustrative mass-balance estimates based on door sealing ratios,
          simulated infiltration factors, and rated CADR delivery curves. They provide comparative
          behavioral planning guidance and do not replace physical in-situ calibrated laser particle
          counters.
        </span>
      </div>
    </div>
  );
}
