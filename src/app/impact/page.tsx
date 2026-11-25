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
} from "@/lib/intelligence/impact-formulas";
import { readStorageJson, writeStorageJson } from "@/lib/storage";
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

const PLEDGES_STORAGE_KEY = "breathewise_impact_pledges_v2";

const DEFAULT_PLEDGES: Pledge[] = [
  { id: "1", title: "Zero Engine Idling at Traffic Signals (>15s)", completed: true, points: 50 },
  { id: "2", title: "Took Public Transit / Metro instead of Solo Drive", completed: true, points: 120 },
  { id: "3", title: "Shared carpool ride with 2+ colleagues", completed: false, points: 100 },
  { id: "4", title: "Reported Open Waste / Stubble Fire via Community Watch", completed: false, points: 150 },
  { id: "5", title: "Ran Certified Energy-Star HEPA instead of biomass heating", completed: true, points: 80 },
];

const SELECTABLE_MODES: ReadonlyArray<{ id: TransitMode; name: string }> = [
  { id: "metro", name: "Metro Rail" },
  { id: "carpool", name: "Carpool (3 pax)" },
  { id: "ev", name: "Electric EV" },
  { id: "cycling", name: "Bicycle" },
  { id: "walk", name: "Walking" },
  { id: "car_diesel", name: "Solo Diesel" },
];

const MODE_ICONS: Record<TransitMode, React.ReactNode> = {
  car_petrol: <Car className="w-4 h-4" />,
  car_diesel: <Car className="w-4 h-4 text-[#FACC15]" />,
  carpool: <Users className="w-4 h-4 text-[#38BDF8]" />,
  metro: <Train className="w-4 h-4 text-[#4DB8FF]" />,
  ev: <Zap className="w-4 h-4 text-[#38BDF8]" />,
  cycling: <Bike className="w-4 h-4 text-[#4DB8FF]" />,
  walk: <Footprints className="w-4 h-4 text-[#4DB8FF]" />,
};

export default function GreenImpactPage() {
  const [distanceKm, setDistanceKm] = useState<number>(14);
  const [workingDays, setWorkingDays] = useState<number>(22);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);
  const [chosenMode, setChosenMode] = useState<TransitMode>("metro");
  const baselineMode: TransitMode = "car_petrol";

  const [pledges, setPledges] = useState<Pledge[]>(() =>
    readStorageJson(PLEDGES_STORAGE_KEY, DEFAULT_PLEDGES)
  );
  const [copied, setCopied] = useState(false);

  const togglePledge = (id: string) => {
    setPledges((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p));
      writeStorageJson(PLEDGES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const comparison = calculateTransportationComparison(
    distanceKm,
    chosenMode,
    baselineMode,
    workingDays,
    isRoundTrip
  );

  const pledgePoints = pledges.filter((p) => p.completed).reduce((acc, p) => acc + p.points, 0);
  const totalImpactScore = pledgePoints + Math.round(comparison.co2SavedMonthlyKg * 4);

  const handleShareSummary = () => {
    const tripLabel = isRoundTrip
      ? `2-Way Round-Trip (${comparison.effectiveDailyDistanceKm} km/day)`
      : `1-Way Commute (${distanceKm} km/day)`;
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

  const resultMetrics = [
    {
      label: "CO2 Avoided",
      icon: <Wind className="w-3.5 h-3.5" />,
      headerClass: "text-[#4DB8FF]",
      borderClass: "border-[rgba(77,184,255,0.25)]",
      valueClass: "text-[#F2F6FA]",
      value: comparison.co2SavedMonthlyKg,
      unit: "kg/mo",
      sublabel: `${comparison.co2SavedDailyKg} kg avoided daily`,
    },
    {
      label: "Fuel Saved",
      icon: <Fuel className="w-3.5 h-3.5" />,
      headerClass: "text-[#FACC15]",
      borderClass: "border-[rgba(255,255,255,0.08)]",
      valueClass: "text-[#F2F6FA]",
      value: comparison.fuelSavedMonthlyLiters,
      unit: "Liters",
      sublabel: `${comparison.fuelSavedDailyLiters} L saved daily`,
    },
    {
      label: "Money Saved",
      icon: <IndianRupee className="w-3.5 h-3.5" />,
      headerClass: "text-[#4DB8FF]",
      borderClass: "border-[rgba(77,184,255,0.25)]",
      valueClass: "text-[#4DB8FF]",
      value: `₹${comparison.moneySavedMonthlyInr.toLocaleString("en-IN")}`,
      unit: "/mo",
      sublabel: `₹${comparison.moneySavedDailyInr} saved daily`,
    },
    {
      label: "Tree Equivalent",
      icon: <TreeDeciduous className="w-3.5 h-3.5" />,
      headerClass: "text-[#38BDF8]",
      borderClass: "border-[rgba(255,255,255,0.08)]",
      valueClass: "text-[#F2F6FA]",
      value: comparison.treesEquivalentAnnual,
      unit: "Trees",
      sublabel: "Annual carbon absorption equivalent",
    },
  ];

  const assumptionsGrid = [
    { label: "Petrol Baseline Price", value: `₹${CALCULATION_ASSUMPTIONS.petrolPricePerLiter} / Liter` },
    { label: "Solo Car Efficiency", value: `${CALCULATION_ASSUMPTIONS.carPetrolEfficiency} km / Liter` },
    { label: "Car Carbon Intensity", value: "192 g CO2e / km" },
    { label: "Metro Carbon Intensity", value: "45 g CO2e / pax-km" },
  ];

  return (
    <PageTransition className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(77,184,255,0.08)] border border-[rgba(77,184,255,0.2)] text-xs font-semibold text-[#4DB8FF] mb-1.5">
            <Leaf className="w-3 h-3" />
            Ecological Transport & Emission Avoidance Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F6FA]">
            Green Impact & Commute Analysis
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Compare travel modes, quantify tailpipe CO2 mitigation, and calculate monthly fuel savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-[#4DB8FF]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#4DB8FF]" />
              )
            }
            onClick={handleShareSummary}
          >
            {copied ? "Copied Impact!" : "Share Impact Summary"}
          </Button>
          <Badge variant="accent" dot>
            {totalImpactScore} Clean Air Pts
          </Badge>
        </div>
      </div>

      {/* Transportation Comparison Calculator Card */}
      <Card
        elevated
        className="p-5 md:p-6 rounded-3xl space-y-6 border border-[rgba(77,184,255,0.2)] bg-[rgba(10,22,17,0.75)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#F2F6FA] flex items-center gap-2">
              <Train className="w-4 h-4 text-[#4DB8FF]" />
              Transportation Emission & Fuel Comparison
            </h2>
            <p className="text-xs text-[#A3B3C2] mt-0.5">
              Select your transit alternative against a private petrol car baseline
            </p>
          </div>
          <Badge variant="subtle" size="sm">
            Modelled IPCC 2023 Guidelines
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#A3B3C2]">
            Select Your Alternative Travel Mode:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {SELECTABLE_MODES.map((m) => {
              const isSelected = chosenMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChosenMode(m.id)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? "bg-[rgba(77,184,255,0.18)] border-[#4DB8FF] text-[#4DB8FF] shadow-sm font-semibold"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)] text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.07)]"
                  }`}
                >
                  {MODE_ICONS[m.id]}
                  <span className="text-xs">{m.name}</span>
                  <span className="text-xs text-[#8496A8]">
                    {TRANSPORT_MODES[m.id].emissionFactorGPerKm} g/km
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#A3B3C2]">Daily One-Way Commute Distance</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#4DB8FF] text-sm">{distanceKm} km one-way</span>
                <span className="text-xs text-[#A3B3C2]">
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
              aria-label="Daily outdoor commute in kilometers"
              className="w-full accent-[#4DB8FF] cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-[#8496A8]">
              <span>1 km (Local)</span>
              <span>30 km (Suburban)</span>
              <span>60 km (Inter-city)</span>
            </div>

            <div className="pt-1.5 flex items-center justify-between bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
              <label
                htmlFor="roundtrip-toggle"
                className="text-xs text-[#F2F6FA] flex items-center gap-2 cursor-pointer"
              >
                <input
                  id="roundtrip-toggle"
                  type="checkbox"
                  checked={isRoundTrip}
                  onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-transparent text-[#4DB8FF] accent-[#4DB8FF] cursor-pointer"
                />
                <span>Include Return Journey (2× Daily Round-Trip)</span>
              </label>
              <Badge variant="subtle" size="sm">
                {isRoundTrip ? "2-Way Commute" : "1-Way Commute"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#A3B3C2]">Monthly Working Days</span>
              <span className="font-bold text-[#38BDF8] text-sm">{workingDays} days/mo</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              aria-label="Monthly working days"
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-[#8496A8]">
              <span>5 days (Hybrid)</span>
              <span>22 days (Standard Office)</span>
              <span>30 days (Full Month)</span>
            </div>
            <div className="pt-2 text-xs text-[#A3B3C2] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Assumes standard 22 working days/month commuting in metropolitan traffic.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-3 border-t border-[rgba(255,255,255,0.08)]">
          {resultMetrics.map((metric) => (
            <div
              key={metric.label}
              className={`p-4 rounded-2xl bg-[rgba(18,29,42,0.7)] border ${metric.borderClass} space-y-1`}
            >
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${metric.headerClass}`}>
                {metric.icon}
                <span>{metric.label}</span>
              </div>
              <div className={`text-2xl font-extrabold tracking-tight ${metric.valueClass}`}>
                {metric.value}
                <span className="text-xs font-normal text-[#A3B3C2] ml-1">{metric.unit}</span>
              </div>
              <div className="text-xs text-[#8496A8]">{metric.sublabel}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transparent Calculation Assumptions */}
      <Card
        elevated
        className="p-5 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-[#F2F6FA]">
          <Info className="w-4 h-4 text-[#38BDF8]" />
          <span>Calculation Assumptions & Scientific Basis</span>
        </div>
        <p className="text-xs text-[#A3B3C2] leading-relaxed">
          All computations are mathematical estimates following the Intergovernmental Panel on Climate
          Change (IPCC 2023) mobile combustion guidelines and the Indian Central Electricity
          Authority (CEA) grid carbon baseline.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {assumptionsGrid.map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]"
            >
              <div className="text-[#8496A8]">{item.label}</div>
              <div className="font-semibold text-[#F2F6FA] mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Personal Clean Air Pledges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FACC15]" />
            <h2 className="text-base font-bold text-[#F2F6FA]">Personal Clean Air Pledges</h2>
          </div>
          <span className="text-xs text-[#A3B3C2]">Tap checkbox to log action</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pledges.map((pledge) => (
            <Card
              key={pledge.id}
              elevated
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                pledge.completed
                  ? "bg-[rgba(77,184,255,0.08)] border-[rgba(77,184,255,0.3)]"
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
                  aria-label={`Toggle pledge: ${pledge.title}`}
                  aria-pressed={pledge.completed}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    pledge.completed
                      ? "bg-[#4DB8FF] border-[#4DB8FF] text-[#0A1118]"
                      : "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  {pledge.completed && <CheckCircle2 className="w-4 h-4 text-[#0A1118]" />}
                </button>
                <span
                  className={`text-xs font-semibold leading-snug ${
                    pledge.completed ? "text-[#F2F6FA]" : "text-[#A3B3C2]"
                  }`}
                >
                  {pledge.title}
                </span>
              </div>

              <Badge variant={pledge.completed ? "accent" : "subtle"} size="sm" className="shrink-0 text-xs">
                +{pledge.points} Pts
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-[rgba(10,22,17,0.5)] border border-[rgba(255,255,255,0.06)] flex items-start gap-2.5 text-xs text-[#A3B3C2] leading-relaxed">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <span>
          <strong>Environmental Model Assumptions:</strong> Vehicle emission factors (Petrol: 192
          g/km, Diesel: 178 g/km, Metro: 45 g/km, EV: 51 g/km well-to-wheel) are illustrative
          planning models derived from IPCC transport benchmarks and CEA India national grid averages.
          Fuel savings assume ₹96.72/L (petrol) and ₹89.62/L (diesel). Inhalation avoidance values
          are comparative estimates, not calibrated personal exposure monitors.
        </span>
      </div>
    </PageTransition>
  );
}
