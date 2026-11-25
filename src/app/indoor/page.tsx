"use client";

import React, { useState } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { HouseholdAssessmentDrawer } from "@/components/indoor/HouseholdAssessmentDrawer";
import { DiyPurifierModal } from "@/components/indoor/DiyPurifierModal";
import { RoomSimulatorSection, type RoomSensor } from "@/components/indoor/RoomSimulatorSection";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  HomeConfig,
  DEFAULT_HOME_CONFIG,
  identifyIndoorSources,
  getBudgetRecommendations,
  BudgetRecommendation,
} from "@/lib/intelligence/indoor-assessment";
import { readStorageJson, writeStorageJson } from "@/lib/storage";
import {
  Home,
  Wind,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Flame,
  DollarSign,
} from "lucide-react";

const INDOOR_STORAGE_KEY = "breathewise_indoor_assessment_v2";

const BUDGET_TIERS = [
  { id: "all", label: "All Tiers" },
  { id: "free", label: "Free (₹0)" },
  { id: "under_500", label: "Under ₹500" },
  { id: "500_3000", label: "₹500 – ₹3,000" },
  { id: "above_3000", label: "Above ₹3,000" },
] as const;

export default function IndoorAirPage() {
  const { airData, activeStandard } = useAirQuality();
  const isCpcb = activeStandard === "INDIA_CPCB";
  const outdoorAqi = isCpcb ? (airData?.indiaAqi ?? 220) : (airData?.usAqi ?? 160);
  const outdoorPm25 = airData?.pollutants.pm2_5?.value ?? 68;

  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() =>
    readStorageJson(INDOOR_STORAGE_KEY, DEFAULT_HOME_CONFIG)
  );
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [selectedBudgetTier, setSelectedBudgetTier] =
    useState<(typeof BUDGET_TIERS)[number]["id"]>("all");
  const [activeDiyModal, setActiveDiyModal] = useState<BudgetRecommendation | null>(null);

  const [rooms, setRooms] = useState<RoomSensor[]>(() => [
    {
      id: "living",
      name: "Living Room (Main Area)",
      estimatedAqi: Math.round(outdoorAqi * 0.35),
      pm2_5: Math.round(outdoorPm25 * 0.28),
      purifierActive: true,
      filterLife: 78,
    },
    {
      id: "master-bed",
      name: "Master Bedroom",
      estimatedAqi: Math.round(outdoorAqi * 0.22),
      pm2_5: Math.round(outdoorPm25 * 0.18),
      purifierActive: true,
      filterLife: 91,
    },
    {
      id: "kitchen",
      name: "Kitchen & Dining",
      estimatedAqi: Math.round(outdoorAqi * 0.58),
      pm2_5: Math.round(outdoorPm25 * 0.52),
      purifierActive: false,
      filterLife: 42,
    },
  ]);

  const saveConfig = (newConfig: HomeConfig) => {
    setHomeConfig(newConfig);
    writeStorageJson(INDOOR_STORAGE_KEY, newConfig);
  };

  const togglePurifier = (id: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextActive = !r.purifierActive;
        return {
          ...r,
          purifierActive: nextActive,
          estimatedAqi: nextActive
            ? Math.max(20, Math.round(r.estimatedAqi * 0.45))
            : Math.round(r.estimatedAqi * 2.1),
          pm2_5: nextActive
            ? Math.max(6, Math.round(r.pm2_5 * 0.45))
            : Math.round(r.pm2_5 * 2.1),
        };
      })
    );
  };

  const assessedSources = airData ? identifyIndoorSources(airData, homeConfig) : [];
  const allBudgetRecs = airData ? getBudgetRecommendations(airData, homeConfig) : [];
  const budgetRecommendations =
    selectedBudgetTier === "all"
      ? allBudgetRecs
      : allBudgetRecs.filter((r) => r.tier === selectedBudgetTier);

  const cadr = homeConfig.purifierCadr || 200;
  const airChangesPerHour = Math.round((cadr / 45) * 10) / 10;
  const canOpenWindows = outdoorAqi < 100 && outdoorPm25 < 35;

  return (
    <PageTransition className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(77,184,255,0.08)] border border-[rgba(77,184,255,0.2)] text-xs font-semibold text-[#4DB8FF] mb-1.5">
            <Home className="w-3 h-3" />
            Indoor Micro-Climate & Filtration Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F6FA]">
            Indoor Air & Household Assessment
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Evaluate internal emissions, simulate room HEPA CADR, and deploy budget-based mitigations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Sliders className="w-3.5 h-3.5 text-[#4DB8FF]" />}
            onClick={() => setAssessmentOpen(!assessmentOpen)}
          >
            {assessmentOpen ? "Close Assessment" : "Household Assessment"}
          </Button>
          <Badge variant={canOpenWindows ? "accent" : "danger"} dot>
            {canOpenWindows ? "Ventilation Permitted" : "Keep Windows Latched"}
          </Badge>
        </div>
      </div>

      <HouseholdAssessmentDrawer
        isOpen={assessmentOpen}
        homeConfig={homeConfig}
        onSaveConfig={saveConfig}
      />

      {/* Ventilation & Atmospheric Verdict Banner */}
      <Card
        elevated
        hoverEffect
        className={`p-4 md:p-5 rounded-3xl border transition-all ${
          canOpenWindows
            ? "border-[rgba(77,184,255,0.3)] bg-gradient-to-r from-[rgba(77,184,255,0.1)] to-[rgba(18,29,42,0.85)]"
            : "border-[rgba(248,113,113,0.3)] bg-gradient-to-r from-[rgba(248,113,113,0.1)] to-[rgba(18,29,42,0.85)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                canOpenWindows
                  ? "bg-[rgba(77,184,255,0.15)] border-[rgba(77,184,255,0.35)] text-[#4DB8FF]"
                  : "bg-[rgba(248,113,113,0.15)] border-[rgba(248,113,113,0.35)] text-[#F87171]"
              }`}
            >
              {canOpenWindows ? (
                <Wind className="w-5 h-5 text-[#4DB8FF]" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#F87171]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F2F6FA]">
                  {canOpenWindows
                    ? "Safe for Natural Cross-Ventilation"
                    : "Smog Infiltration Hazard — Keep Windows Latched"}
                </span>
                <Badge variant={canOpenWindows ? "accent" : "danger"} size="sm" className="text-xs">
                  Outdoor AQI {outdoorAqi}
                </Badge>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                {canOpenWindows
                  ? "Outdoor PM2.5 levels are below 35 µg/m³. Flush stale indoor CO2 with a 15-minute cross-breeze."
                  : "Outdoor particulates exceed safe respiratory thresholds. Active indoor recirculation recommended."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[#A3B3C2] shrink-0 border-t sm:border-t-0 sm:border-l border-[rgba(255,255,255,0.08)] pt-2 sm:pt-0 sm:pl-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8496A8]">Bedroom CADR</div>
              <div className="text-sm font-bold text-[#F2F6FA]">{cadr} m³/h</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8496A8]">Air Changes / Hr</div>
              <div className="text-sm font-bold text-[#4DB8FF]">{airChangesPerHour} ACH</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Identified Indoor Pollution Sources Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FACC15]" />
            <h2 className="text-base font-bold text-[#F2F6FA]">
              Identified Household Pollution Sources
            </h2>
          </div>
          <span className="text-xs text-[#A3B3C2]">Modeled estimates based on assessment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessedSources.map((source) => (
            <Card
              key={source.id}
              elevated
              hoverEffect
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,29,42,0.65)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F2F6FA]">{source.name}</span>
                    <Badge
                      variant={
                        source.severity === "CRITICAL"
                          ? "danger"
                          : source.severity === "HIGH"
                          ? "warning"
                          : "subtle"
                      }
                      size="sm"
                      className="text-xs"
                    >
                      {source.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-[#4DB8FF] font-semibold">
                    Pollutant: {source.pollutantType}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#F87171]">
                    {source.estimatedContribution}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-[#8496A8]">Est. Load</div>
                </div>
              </div>

              <p className="text-xs text-[#A3B3C2] leading-relaxed">{source.description}</p>

              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-xs text-[#F2F6FA]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4DB8FF] shrink-0" />
                <span className="leading-tight">{source.mitigation}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Budget-Based Clean Air Recommendations */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#4DB8FF]" />
              <h2 className="text-base font-bold text-[#F2F6FA]">
                Budget-Based Recommendations & DIY Guides
              </h2>
            </div>
            <p className="text-xs text-[#A3B3C2] mt-0.5">
              Affordable, proven steps to clean indoor air from zero-cost habit changes to certified purifiers.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {BUDGET_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedBudgetTier(tier.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedBudgetTier === tier.id
                    ? "bg-[#4DB8FF] text-[#0A1118] font-bold shadow-sm"
                    : "bg-[rgba(14,23,34,0.6)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetRecommendations.map((rec) => (
            <Card
              key={rec.id}
              elevated
              hoverEffect
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,29,42,0.65)] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      rec.tier === "free"
                        ? "accent"
                        : rec.tier === "under_500"
                        ? "subtle"
                        : rec.tier === "500_3000"
                        ? "warning"
                        : "outline"
                    }
                    size="sm"
                    className="text-xs font-bold"
                  >
                    {rec.costLabel}
                  </Badge>
                  <span className="text-xs font-semibold text-[#4DB8FF]">
                    {rec.impactReduction}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#F2F6FA] leading-snug">{rec.title}</h3>
                <p className="text-xs text-[#A3B3C2] leading-relaxed">{rec.description}</p>
              </div>

              {rec.diyGuide && (
                <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <button
                    type="button"
                    onClick={() => setActiveDiyModal(rec)}
                    className="text-xs font-semibold text-[#4DB8FF] hover:text-[#7CCBFF] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Read Step-by-Step DIY Guide</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <RoomSimulatorSection rooms={rooms} onTogglePurifier={togglePurifier} />

      <DiyPurifierModal activeDiyModal={activeDiyModal} onClose={() => setActiveDiyModal(null)} />
    </PageTransition>
  );
}
