"use client";

import React, { useState } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  HomeConfig,
  DEFAULT_HOME_CONFIG,
  identifyIndoorSources,
  getBudgetRecommendations,
  IndoorPollutantSource,
  BudgetRecommendation,
} from "@/lib/intelligence/indoor-assessment";
import {
  Home,
  Wind,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Power,
  Sparkles,
  Sliders,
  Flame,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RoomSensor {
  id: string;
  name: string;
  estimatedAqi: number;
  pm2_5: number;
  purifierActive: boolean;
  filterLife: number;
}

export default function IndoorAirPage() {
  const { airData } = useAirQuality();
  const outdoorAqi = airData?.usAqi ?? 160;
  const outdoorPm25 = airData?.pollutants.pm2_5?.value ?? 68;

  // Household assessment config state with localStorage persistence
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("breathewise_indoor_assessment_v2");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_HOME_CONFIG;
  });
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<
    "all" | "free" | "under_500" | "500_3000" | "above_3000"
  >("all");
  const [activeDiyModal, setActiveDiyModal] = useState<BudgetRecommendation | null>(null);

  // Room sensors state
  const [rooms, setRooms] = useState<RoomSensor[]>([
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
    try {
      localStorage.setItem("breathewise_indoor_assessment_v2", JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const togglePurifier = (id: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
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
        }
        return r;
      })
    );
  };

  // Run intelligence evaluations
  const assessedSources: IndoorPollutantSource[] = airData
    ? identifyIndoorSources(airData, homeConfig)
    : [];

  const allBudgetRecs: BudgetRecommendation[] = airData
    ? getBudgetRecommendations(airData, homeConfig)
    : [];

  const budgetRecommendations: BudgetRecommendation[] =
    selectedBudgetTier === "all"
      ? allBudgetRecs
      : allBudgetRecs.filter((r) => r.tier === selectedBudgetTier);

  // CADR ACH calculation for a standard 180 sq ft bedroom with 9 ft ceiling (~45 m3)
  const roomVolumeM3 = 45;
  const cadr = homeConfig.purifierCadr || 200;
  const airChangesPerHour = Math.round((cadr / roomVolumeM3) * 10) / 10;

  // Ventilation Window Verdict
  const canOpenWindows = outdoorAqi < 100 && outdoorPm25 < 35;

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(0,214,154,0.08)] border border-[rgba(0,214,154,0.2)] text-[11px] font-semibold text-[#00D69A] mb-1.5">
            <Home className="w-3 h-3" />
            Indoor Micro-Climate & Filtration Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F8F6]">
            Indoor Air & Household Assessment
          </h1>
          <p className="text-xs text-[#98A9A1] mt-0.5">
            Evaluate internal emissions, simulate room HEPA CADR, and deploy budget-based mitigations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Sliders className="w-3.5 h-3.5 text-[#00D69A]" />}
            onClick={() => setAssessmentOpen(!assessmentOpen)}
          >
            {assessmentOpen ? "Close Assessment" : "Household Assessment"}
          </Button>
          <Badge variant={canOpenWindows ? "accent" : "danger"} dot>
            {canOpenWindows ? "Ventilation Permitted" : "Keep Windows Latched"}
          </Badge>
        </div>
      </div>

      {/* Household Assessment Collapsible Drawer */}
      <AnimatePresence>
        {assessmentOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card elevated className="p-5 md:p-6 rounded-3xl border-[rgba(0,214,154,0.25)] bg-[rgba(10,22,17,0.85)] space-y-5">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00D69A]" />
                  <h3 className="text-sm font-bold text-[#F5F8F6]">
                    Household Assessment Form
                  </h3>
                </div>
                <span className="text-[11px] text-[#98A9A1]">
                  Personalizes indoor source mitigation
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Home Size & Air Purifier */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#98A9A1]">
                    Apartment / Home Size ({homeConfig.homeSizeSqFt} sq.ft)
                  </label>
                  <input
                    type="range"
                    min="300"
                    max="3000"
                    step="50"
                    value={homeConfig.homeSizeSqFt ?? 650}
                    onChange={(e) =>
                      saveConfig({
                        ...homeConfig,
                        homeSizeSqFt: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#00D69A] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#64786E]">
                    <span>300 sq.ft (Studio)</span>
                    <span>3000 sq.ft (Bungalow)</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-[#F5F8F6]">HEPA Air Purifier</span>
                    <button
                      onClick={() =>
                        saveConfig({
                          ...homeConfig,
                          hasAirPurifier: !homeConfig.hasAirPurifier,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        homeConfig.hasAirPurifier
                          ? "bg-[#00D69A] text-[#07100D]"
                          : "bg-[rgba(255,255,255,0.08)] text-[#98A9A1]"
                      }`}
                    >
                      {homeConfig.hasAirPurifier ? "Active / Owned" : "None"}
                    </button>
                  </div>
                </div>

                {/* 2. Window Drafts & Infiltration */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#98A9A1]">
                    Window & Door Draft Seal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "sealed", label: "Airtight" },
                      { key: "moderate", label: "Moderate" },
                      { key: "leaky", label: "Drafty" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          saveConfig({
                            ...homeConfig,
                            windowDrafts: opt.key as HomeConfig["windowDrafts"],
                          })
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer border ${
                          homeConfig.windowDrafts === opt.key
                            ? "bg-[rgba(0,214,154,0.18)] border-[#00D69A] text-[#00D69A] font-semibold"
                            : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-[#98A9A1] hover:text-[#F5F8F6]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-semibold text-[#98A9A1] block mb-1.5">
                      Daily Floor Dusting Method
                    </label>
                    <select
                      value={homeConfig.dustingMethod ?? "wet_mop"}
                      onChange={(e) =>
                        saveConfig({
                          ...homeConfig,
                          dustingMethod: e.target.value as HomeConfig["dustingMethod"],
                        })
                      }
                      className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                    >
                      <option value="wet_mop">Wet Microfiber Mopping (Optimal)</option>
                      <option value="dry_broom">Dry Broom Sweeping (High Resuspension)</option>
                      <option value="hepa_vacuum">HEPA-Sealed Vacuum</option>
                    </select>
                  </div>
                </div>

                {/* 3. Cooking Fuel & Incense */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#98A9A1] block mb-1.5">
                    Kitchen Cooking Setup
                  </label>
                  <select
                    value={homeConfig.cookingType ?? "lpg_exhaust"}
                    onChange={(e) =>
                      saveConfig({
                        ...homeConfig,
                        cookingType: e.target.value as HomeConfig["cookingType"],
                      })
                    }
                    className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                  >
                    <option value="lpg_exhaust">LPG / Piped Gas with Exhaust Chimney</option>
                    <option value="lpg_no_exhaust">LPG / Gas without Exhaust Hood</option>
                    <option value="electric">Electric Induction / Ceramic Stove</option>
                    <option value="chulha">Traditional Biomass / Chulha (High Risk)</option>
                  </select>

                  <div className="pt-2">
                    <label className="text-xs font-semibold text-[#98A9A1] block mb-1.5">
                      Agarbatti / Incense / Dhoop
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "never", label: "Never" },
                        { key: "occasional", label: "Weekly" },
                        { key: "daily", label: "Daily" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            saveConfig({
                              ...homeConfig,
                              incenseUsage: opt.key as HomeConfig["incenseUsage"],
                            })
                          }
                          className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer border ${
                            homeConfig.incenseUsage === opt.key
                              ? "bg-[rgba(0,214,154,0.18)] border-[#00D69A] text-[#00D69A] font-semibold"
                              : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-[#98A9A1] hover:text-[#F5F8F6]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ventilation & Atmospheric Verdict Banner */}
      <Card
        elevated
        className={`p-4 md:p-5 rounded-3xl border transition-all ${
          canOpenWindows
            ? "border-[rgba(0,214,154,0.3)] bg-gradient-to-r from-[rgba(0,214,154,0.1)] to-[rgba(10,22,17,0.7)]"
            : "border-[rgba(248,113,113,0.3)] bg-gradient-to-r from-[rgba(248,113,113,0.1)] to-[rgba(10,22,17,0.7)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                canOpenWindows
                  ? "bg-[rgba(0,214,154,0.15)] border-[rgba(0,214,154,0.35)] text-[#00D69A]"
                  : "bg-[rgba(248,113,113,0.15)] border-[rgba(248,113,113,0.35)] text-[#F87171]"
              }`}
            >
              {canOpenWindows ? (
                <Wind className="w-5 h-5 text-[#00D69A]" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#F87171]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F5F8F6]">
                  {canOpenWindows
                    ? "Safe for Natural Cross-Ventilation"
                    : "Smog Infiltration Hazard — Keep Windows Latched"}
                </span>
                <Badge
                  variant={canOpenWindows ? "accent" : "danger"}
                  size="sm"
                  className="text-[10px]"
                >
                  Outdoor AQI {outdoorAqi}
                </Badge>
              </div>
              <p className="text-xs text-[#98A9A1] mt-0.5">
                {canOpenWindows
                  ? "Outdoor PM2.5 levels are below 35 µg/m³. Flush stale indoor CO2 with a 15-minute cross-breeze."
                  : "Outdoor particulates exceed safe respiratory thresholds. Active indoor recirculation recommended."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[#98A9A1] shrink-0 border-t sm:border-t-0 sm:border-l border-[rgba(255,255,255,0.08)] pt-2 sm:pt-0 sm:pl-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#64786E]">
                Bedroom CADR
              </div>
              <div className="text-sm font-bold text-[#F5F8F6]">
                {cadr} m³/h
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#64786E]">
                Air Changes / Hr
              </div>
              <div className="text-sm font-bold text-[#00D69A]">
                {airChangesPerHour} ACH
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Identified Indoor Pollution Sources Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FACC15]" />
            <h2 className="text-base font-bold text-[#F5F8F6]">
              Identified Household Pollution Sources
            </h2>
          </div>
          <span className="text-xs text-[#98A9A1]">
            Modeled estimates based on assessment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessedSources.map((source) => (
            <Card
              key={source.id}
              elevated
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(9,18,14,0.7)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F5F8F6]">
                      {source.name}
                    </span>
                    <Badge
                      variant={
                        source.severity === "CRITICAL"
                          ? "danger"
                          : source.severity === "HIGH"
                          ? "warning"
                          : "subtle"
                      }
                      size="sm"
                      className="text-[10px]"
                    >
                      {source.severity}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#00D69A] font-semibold">
                    Pollutant: {source.pollutantType}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#F87171]">
                    {source.estimatedContribution}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-[#64786E]">
                    Est. Load
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#98A9A1] leading-relaxed">
                {source.description}
              </p>

              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-[11px] text-[#F5F8F6]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D69A] shrink-0" />
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
              <DollarSign className="w-4 h-4 text-[#00D69A]" />
              <h2 className="text-base font-bold text-[#F5F8F6]">
                Budget-Based Recommendations & DIY Guides
              </h2>
            </div>
            <p className="text-xs text-[#98A9A1] mt-0.5">
              Affordable, proven steps to clean indoor air from zero-cost habitchanges to certified purifiers.
            </p>
          </div>

          {/* Budget Tier Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Tiers" },
              { id: "free", label: "Free (₹0)" },
              { id: "under_500", label: "Under ₹500" },
              { id: "500_3000", label: "₹500 – ₹3,000" },
              { id: "above_3000", label: "Above ₹3,000" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedBudgetTier(tier.id as typeof selectedBudgetTier)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedBudgetTier === tier.id
                    ? "bg-[#00D69A] text-[#07100D] font-bold shadow-sm"
                    : "bg-[rgba(10,20,16,0.6)] text-[#98A9A1] hover:text-[#F5F8F6] border border-[rgba(255,255,255,0.06)]"
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
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] flex flex-col justify-between space-y-3"
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
                    className="text-[10px] font-bold"
                  >
                    {rec.costLabel}
                  </Badge>
                  <span className="text-[11px] font-semibold text-[#00D69A]">
                    {rec.impactReduction}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#F5F8F6] leading-snug">
                  {rec.title}
                </h3>
                <p className="text-xs text-[#98A9A1] leading-relaxed">
                  {rec.description}
                </p>
              </div>

              {rec.diyGuide && (
                <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <button
                    onClick={() => setActiveDiyModal(rec)}
                    className="text-xs font-semibold text-[#00D69A] hover:text-[#05E5A6] flex items-center gap-1.5 cursor-pointer"
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

      {/* Interactive Room Sensor Simulators */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-base font-bold text-[#F5F8F6]">
              Interactive Room Telemetry & Purifier Control
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="subtle" size="sm" className="border-[rgba(56,189,248,0.3)] text-[#38BDF8] bg-[rgba(56,189,248,0.08)]">
              Simulated Room Sensor Telemetry
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card
              key={room.id}
              elevated
              className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#F5F8F6]">
                    {room.name}
                  </span>
                  <div className="text-[10px] text-[#64786E] flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    <span>Modeled Infiltration Telemetry</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePurifier(room.id)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    room.purifierActive
                      ? "bg-[rgba(0,214,154,0.2)] border-[#00D69A] text-[#00D69A]"
                      : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#64786E]"
                  }`}
                  title={room.purifierActive ? "Turn Purifier OFF" : "Turn Purifier ON"}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-3xl font-extrabold text-[#F5F8F6] tracking-tight">
                    {room.estimatedAqi}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#98A9A1]">
                    Indoor Est. AQI
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00D69A]">
                    {room.pm2_5} µg/m³
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#64786E]">
                    PM2.5 Conc.
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-[#98A9A1]">
                  <span>HEPA Filter Life</span>
                  <span className="font-semibold text-[#F5F8F6]">{room.filterLife}%</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00D69A] rounded-full"
                    style={{ width: `${room.filterLife}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* DIY Step-by-Step Guide Modal */}
      <AnimatePresence>
        {activeDiyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setActiveDiyModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.15)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div>
                  <Badge variant="accent" size="sm" className="mb-1 text-[10px]">
                    {activeDiyModal.costLabel}
                  </Badge>
                  <h3 className="text-base font-bold text-[#F5F8F6]">
                    {activeDiyModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDiyModal(null)}
                  className="p-1 rounded-lg text-[#98A9A1] hover:text-[#F5F8F6] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[rgba(0,214,154,0.08)] border border-[rgba(0,214,154,0.2)] text-xs text-[#00D69A] font-semibold">
                Expected Clean Air Impact: {activeDiyModal.impactReduction}
              </div>

              <div className="text-xs text-[#98A9A1] space-y-2 whitespace-pre-line leading-relaxed">
                {activeDiyModal.diyGuide}
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => setActiveDiyModal(null)}
              >
                Close Guide
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
