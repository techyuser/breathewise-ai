"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TransitMode,
  TRANSPORT_MODES,
  CALCULATION_ASSUMPTIONS,
  calculateTransportationComparison,
  TransportComparisonResult,
} from "@/lib/intelligence/impact-formulas";
import {
  Leaf,
  Award,
  Wind,
  CheckCircle2,
  TreeDeciduous,
  Copy,
  Check,
  Fuel,
  IndianRupee,
  Car,
  Train,
  Users,
  Zap,
  Bike,
  Footprints,
  Info,
} from "lucide-react";

interface Pledge {
  id: string;
  title: string;
  completed: boolean;
  points: number;
}

const DEFAULT_PLEDGES: Pledge[] = [
  { id: "1", title: "Zero Engine Idling at Traffic Signals (>15s)", completed: true, points: 50 },
  { id: "2", title: "Took Public Transit / Metro instead of Solo Drive", completed: true, points: 120 },
  { id: "3", title: "Shared carpool ride with 2+ colleagues", completed: false, points: 100 },
  { id: "4", title: "Reported Open Waste / Stubble Fire via Community Watch", completed: false, points: 150 },
  { id: "5", title: "Ran Certified Energy-Star HEPA instead of biomass heating", completed: true, points: 80 },
];

export default function GreenImpactPage() {
  const [distanceKm, setDistanceKm] = useState<number>(14);
  const [workingDays, setWorkingDays] = useState<number>(22);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);
  const [chosenMode, setChosenMode] = useState<TransitMode>("metro");
  const baselineMode: TransitMode = "car_petrol";

  const [pledges, setPledges] = useState<Pledge[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("breathewise_impact_pledges_v2");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PLEDGES;
  });

  const [copied, setCopied] = useState(false);

  const togglePledge = (id: string) => {
    setPledges((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, completed: !p.completed } : p
      );
      try {
        localStorage.setItem("breathewise_impact_pledges_v2", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Run real-time transportation comparison calculation (with 2-way round-trip support)
  const comparison: TransportComparisonResult = calculateTransportationComparison(
    distanceKm,
    chosenMode,
    baselineMode,
    workingDays,
    isRoundTrip
  );

  // Total Clean Air Score
  const pledgePoints = pledges.filter((p) => p.completed).reduce((acc, p) => acc + p.points, 0);
  const transitPoints = Math.round(comparison.co2SavedMonthlyKg * 4);
  const totalImpactScore = pledgePoints + transitPoints;

  const handleShareSummary = () => {
    const tripLabel = isRoundTrip ? `2-Way Round-Trip (${comparison.effectiveDailyDistanceKm} km/day)` : `1-Way Commute (${distanceKm} km/day)`;
    const summary = `🌿 BreatheWise AI — My Green Commute Impact:
• Transit: ${TRANSPORT_MODES[chosenMode].name} vs ${TRANSPORT_MODES[baselineMode].name}
• Commute Distance: ${tripLabel} (${workingDays} working days/mo)
• Monthly CO2 Avoided: ${comparison.co2SavedMonthlyKg} kg CO2e
• Fuel Saved: ${comparison.fuelSavedMonthlyLiters} L (₹${comparison.moneySavedMonthlyInr.toLocaleString("en-IN")})
• Tree Equivalent: ${comparison.treesEquivalentAnnual} mature trees/year
• Inhaled PM2.5 Avoided: ${comparison.particulateExposureAvoidedMg} mg
Join clean air initiatives on BreatheWise AI!`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const modeIcons: Record<TransitMode, React.ReactNode> = {
    car_petrol: <Car className="w-4 h-4" />,
    car_diesel: <Car className="w-4 h-4 text-[#FACC15]" />,
    carpool: <Users className="w-4 h-4 text-[#38BDF8]" />,
    metro: <Train className="w-4 h-4 text-[#00D69A]" />,
    ev: <Zap className="w-4 h-4 text-[#38BDF8]" />,
    cycling: <Bike className="w-4 h-4 text-[#00D69A]" />,
    walk: <Footprints className="w-4 h-4 text-[#00D69A]" />,
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(0,214,154,0.08)] border border-[rgba(0,214,154,0.2)] text-[11px] font-semibold text-[#00D69A] mb-1.5">
            <Leaf className="w-3 h-3" />
            Ecological Transport & Emission Avoidance Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F8F6]">
            Green Impact & Commute Analysis
          </h1>
          <p className="text-xs text-[#98A9A1] mt-0.5">
            Compare travel modes, quantify tailpipe CO2 mitigation, and calculate monthly fuel savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5 text-[#00D69A]" /> : <Copy className="w-3.5 h-3.5 text-[#00D69A]" />}
            onClick={handleShareSummary}
          >
            {copied ? "Copied Impact!" : "Share Impact Summary"}
          </Button>
          <Badge variant="accent" dot>
            {totalImpactScore} Clean Air Pts
          </Badge>
        </div>
      </div>

      {/* Main Transportation Comparison Calculator Card */}
      <Card elevated className="p-5 md:p-6 rounded-3xl space-y-6 border border-[rgba(0,214,154,0.2)] bg-[rgba(10,22,17,0.75)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#F5F8F6] flex items-center gap-2">
              <Train className="w-4 h-4 text-[#00D69A]" />
              Transportation Emission & Fuel Comparison
            </h2>
            <p className="text-xs text-[#98A9A1] mt-0.5">
              Select your transit alternative against a private petrol car baseline
            </p>
          </div>
          <Badge variant="subtle" size="sm">
            Modelled IPCC 2023 Guidelines
          </Badge>
        </div>

        {/* Mode Selector Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#98A9A1]">
            Select Your Alternative Travel Mode:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: "metro", name: "Metro Rail" },
              { id: "carpool", name: "Carpool (3 pax)" },
              { id: "ev", name: "Electric EV" },
              { id: "cycling", name: "Bicycle" },
              { id: "walk", name: "Walking" },
              { id: "car_diesel", name: "Solo Diesel" },
            ].map((m) => {
              const modeKey = m.id as TransitMode;
              const isSelected = chosenMode === modeKey;
              return (
                <button
                  key={m.id}
                  onClick={() => setChosenMode(modeKey)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? "bg-[rgba(0,214,154,0.18)] border-[#00D69A] text-[#00D69A] shadow-sm font-semibold"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)] text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.07)]"
                  }`}
                >
                  {modeIcons[modeKey]}
                  <span className="text-xs">{m.name}</span>
                  <span className="text-[10px] text-[#64786E]">
                    {TRANSPORT_MODES[modeKey].emissionFactorGPerKm} g/km
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Distance & Working Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Daily Commute Distance Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#98A9A1]">Daily One-Way Commute Distance</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00D69A] text-sm">{distanceKm} km one-way</span>
                <span className="text-[11px] text-[#98A9A1]">
                  ({comparison.effectiveDailyDistanceKm} km/day total)
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full accent-[#00D69A] cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-[#64786E]">
              <span>1 km (Local)</span>
              <span>30 km (Suburban)</span>
              <span>60 km (Inter-city)</span>
            </div>

            {/* Round-trip Commute Toggle */}
            <div className="pt-1.5 flex items-center justify-between bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
              <label htmlFor="roundtrip-toggle" className="text-xs text-[#F5F8F6] flex items-center gap-2 cursor-pointer">
                <input
                  id="roundtrip-toggle"
                  type="checkbox"
                  checked={isRoundTrip}
                  onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-transparent text-[#00D69A] accent-[#00D69A] cursor-pointer"
                />
                <span>Include Return Journey (2× Daily Round-Trip)</span>
              </label>
              <Badge variant="subtle" size="sm">
                {isRoundTrip ? "2-Way Commute" : "1-Way Commute"}
              </Badge>
            </div>
          </div>

          {/* Monthly Working Days Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#98A9A1]">Monthly Working Days</span>
              <span className="font-bold text-[#38BDF8] text-sm">{workingDays} days/mo</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-[#64786E]">
              <span>5 days (Hybrid)</span>
              <span>22 days (Standard Office)</span>
              <span>30 days (Full Month)</span>
            </div>
            <div className="pt-2 text-[11px] text-[#98A9A1] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Assumes standard 22 working days/month commuting in metropolitan traffic.</span>
            </div>
          </div>
        </div>

        {/* Real-Time Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-3 border-t border-[rgba(255,255,255,0.08)]">
          {/* Metric 1: Monthly CO2 Avoided */}
          <div className="p-4 rounded-2xl bg-[rgba(12,24,19,0.7)] border border-[rgba(0,214,154,0.25)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#00D69A] font-semibold">
              <Wind className="w-3.5 h-3.5" />
              <span>CO2 Avoided</span>
            </div>
            <div className="text-2xl font-extrabold text-[#F5F8F6] tracking-tight">
              {comparison.co2SavedMonthlyKg}
              <span className="text-xs font-normal text-[#98A9A1] ml-1">kg/mo</span>
            </div>
            <div className="text-[10px] text-[#64786E]">
              {comparison.co2SavedDailyKg} kg avoided daily
            </div>
          </div>

          {/* Metric 2: Fuel Saved */}
          <div className="p-4 rounded-2xl bg-[rgba(12,24,19,0.7)] border border-[rgba(255,255,255,0.08)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#FACC15] font-semibold">
              <Fuel className="w-3.5 h-3.5" />
              <span>Fuel Saved</span>
            </div>
            <div className="text-2xl font-extrabold text-[#F5F8F6] tracking-tight">
              {comparison.fuelSavedMonthlyLiters}
              <span className="text-xs font-normal text-[#98A9A1] ml-1">Liters</span>
            </div>
            <div className="text-[10px] text-[#64786E]">
              {comparison.fuelSavedDailyLiters} L saved daily
            </div>
          </div>

          {/* Metric 3: Money Saved in INR */}
          <div className="p-4 rounded-2xl bg-[rgba(12,24,19,0.7)] border border-[rgba(0,214,154,0.25)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#00D69A] font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Money Saved</span>
            </div>
            <div className="text-2xl font-extrabold text-[#00D69A] tracking-tight">
              ₹{comparison.moneySavedMonthlyInr.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-[#98A9A1] ml-1">/mo</span>
            </div>
            <div className="text-[10px] text-[#64786E]">
              ₹{comparison.moneySavedDailyInr} saved daily
            </div>
          </div>

          {/* Metric 4: Trees Equivalent */}
          <div className="p-4 rounded-2xl bg-[rgba(12,24,19,0.7)] border border-[rgba(255,255,255,0.08)] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#38BDF8] font-semibold">
              <TreeDeciduous className="w-3.5 h-3.5" />
              <span>Tree Equivalent</span>
            </div>
            <div className="text-2xl font-extrabold text-[#F5F8F6] tracking-tight">
              {comparison.treesEquivalentAnnual}
              <span className="text-xs font-normal text-[#98A9A1] ml-1">Trees</span>
            </div>
            <div className="text-[10px] text-[#64786E]">
              Annual carbon absorption equivalent
            </div>
          </div>
        </div>
      </Card>

      {/* Transparent Calculation Assumptions & Methodology Card */}
      <Card elevated className="p-5 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F5F8F6]">
          <Info className="w-4 h-4 text-[#38BDF8]" />
          <span>Calculation Assumptions & Scientific Basis</span>
        </div>
        <p className="text-xs text-[#98A9A1] leading-relaxed">
          All computations are mathematical estimates following the Intergovernmental Panel on Climate Change (IPCC 2023) mobile combustion guidelines and the Indian Central Electricity Authority (CEA) grid carbon baseline.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="text-[#64786E]">Petrol Baseline Price</div>
            <div className="font-semibold text-[#F5F8F6] mt-0.5">₹{CALCULATION_ASSUMPTIONS.petrolPricePerLiter} / Liter</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="text-[#64786E]">Solo Car Efficiency</div>
            <div className="font-semibold text-[#F5F8F6] mt-0.5">{CALCULATION_ASSUMPTIONS.carPetrolEfficiency} km / Liter</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="text-[#64786E]">Car Carbon Intensity</div>
            <div className="font-semibold text-[#F5F8F6] mt-0.5">192 g CO2e / km</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="text-[#64786E]">Metro Carbon Intensity</div>
            <div className="font-semibold text-[#F5F8F6] mt-0.5">45 g CO2e / pax-km</div>
          </div>
        </div>
      </Card>

      {/* Community Clean Air Pledges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FACC15]" />
            <h2 className="text-base font-bold text-[#F5F8F6]">
              Personal Clean Air Pledges
            </h2>
          </div>
          <span className="text-xs text-[#98A9A1]">
            Tap checkbox to log action
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pledges.map((pledge) => (
            <Card
              key={pledge.id}
              elevated
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                pledge.completed
                  ? "bg-[rgba(0,214,154,0.08)] border-[rgba(0,214,154,0.3)]"
                  : "bg-[rgba(9,18,14,0.7)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              }`}
              onClick={() => togglePledge(pledge.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePledge(pledge.id);
                  }}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    pledge.completed
                      ? "bg-[#00D69A] border-[#00D69A] text-[#07100D]"
                      : "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  {pledge.completed && <CheckCircle2 className="w-4 h-4 text-[#07100D]" />}
                </button>
                <span
                  className={`text-xs font-semibold leading-snug ${
                    pledge.completed ? "text-[#F5F8F6]" : "text-[#98A9A1]"
                  }`}
                >
                  {pledge.title}
                </span>
              </div>

              <Badge
                variant={pledge.completed ? "accent" : "subtle"}
                size="sm"
                className="shrink-0 text-[10px]"
              >
                +{pledge.points} Pts
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
