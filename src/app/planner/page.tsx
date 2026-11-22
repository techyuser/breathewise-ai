"use client";

import React, { useState, useMemo } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  CalendarClock,
  Sparkles,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  Circle,
  Sun,
  Sunrise,
  Moon,
  Users,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Trash2,
  HeartPulse,
  Wind,
  Activity,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  generateDailyRoutine,
  FamilyProfileInput,
  RoutineActivity,
  DEFAULT_FAMILY_PROFILE,
} from "@/lib/intelligence/routine-generator";
import {
  UserPlanInput,
  PlanVerificationResult,
  verifyPlanDeterministic,
} from "@/lib/intelligence/plan-verifier";
import type { AirQualityData } from "@/types/air-quality";
import { cn } from "@/lib/utils";

const PLANNER_STORAGE_KEY = "breathewise_planner_data_v2";

const PRESET_PLANS = [
  {
    label: "🏃 5K Morning Run",
    name: "Morning 5K Outdoor Run",
    time: "07:00 AM",
    duration: 45,
    env: "outdoor" as const,
    intensity: "vigorous" as const,
    cohort: "athlete" as const,
    mask: false,
  },
  {
    label: "⚽ Kids Football Practice",
    name: "Kids Outdoor Football Practice",
    time: "04:30 PM",
    duration: 60,
    env: "outdoor" as const,
    intensity: "vigorous" as const,
    cohort: "kids" as const,
    mask: false,
  },
  {
    label: "🚲 Bike Commute",
    name: "Two-Wheeler / Bicycle Commute to Office",
    time: "08:30 AM",
    duration: 35,
    env: "transit" as const,
    intensity: "moderate" as const,
    cohort: "general" as const,
    mask: true,
  },
  {
    label: "🛍️ Evening Street Market",
    name: "Outdoor Vegetable & Street Market Shopping",
    time: "07:00 PM",
    duration: 45,
    env: "outdoor" as const,
    intensity: "light" as const,
    cohort: "general" as const,
    mask: true,
  },
  {
    label: "🧘 Indoor Yoga (HEPA)",
    name: "Morning Yoga & Pranayama in Living Room",
    time: "06:30 AM",
    duration: 40,
    env: "indoor_hepa" as const,
    intensity: "light" as const,
    cohort: "asthma" as const,
    mask: false,
  },
];

export default function PlannerPage() {
  const { airData, loading, activeStandard } = useAirQuality();

  const [lang, setLang] = useState<"en" | "hi">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lang === "en" || parsed.lang === "hi") return parsed.lang;
        }
      } catch (_err) {
        // Safe fallback when localStorage is restricted or in private browsing
      }
    }
    return "en";
  });

  const [profile, setProfile] = useState<FamilyProfileInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.profile) return parsed.profile;
        }
      } catch (_err) {
        // Safe fallback when localStorage is restricted or in private browsing
      }
    }
    return DEFAULT_FAMILY_PROFILE;
  });

  const [activities, setActivities] = useState<RoutineActivity[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.activities && parsed.activities.length > 0) {
            return parsed.activities;
          }
        }
      } catch (_err) {
        // Safe fallback when localStorage is restricted or in private browsing
      }
    }
    return [];
  });

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // User Custom Plan Verification State
  const [planInput, setPlanInput] = useState<UserPlanInput>({
    activityName: "",
    plannedTime: "07:00 AM",
    durationMinutes: 45,
    environment: "outdoor",
    intensity: "vigorous",
    cohort: profile.cohort === "asthma" ? "asthma" : profile.cohort === "infant" ? "infant" : profile.hasKids ? "kids" : "general",
    hasN95Mask: false,
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PlanVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  // Compute effective activities: either user-modified/persisted or freshly synthesized from airData
  const effectiveActivities = useMemo(() => {
    if (activities.length > 0) return activities;
    if (airData) return generateDailyRoutine(airData, lang, profile);
    return [];
  }, [activities, airData, lang, profile]);

  const persistState = (
    prof: FamilyProfileInput,
    acts: RoutineActivity[],
    l: "en" | "hi"
  ) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        PLANNER_STORAGE_KEY,
        JSON.stringify({ profile: prof, activities: acts, lang: l })
      );
    }
  };

  // Regenerate when language or profile updates
  const handleRegenerate = (customProfile?: FamilyProfileInput, targetLang?: "en" | "hi") => {
    if (!airData) return;
    const activeProf = customProfile || profile;
    const activeL = targetLang || lang;
    const fresh = generateDailyRoutine(airData, activeL, activeProf);

    // Keep custom activities if any were added
    const customActivities = effectiveActivities.filter((a) => a.isCustom);
    const combined = [...customActivities, ...fresh];

    setActivities(combined);
    persistState(activeProf, combined, activeL);
  };

  const toggleActionCompleted = (id: string) => {
    const updated = effectiveActivities.map((act) =>
      act.id === id ? { ...act, completed: !act.completed } : act
    );
    setActivities(updated);
    persistState(profile, updated, lang);
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLanguageSwitch = (newLang: "en" | "hi") => {
    setLang(newLang);
    handleRegenerate(profile, newLang);
  };

  const handleResetToDefault = () => {
    setProfile(DEFAULT_FAMILY_PROFILE);
    if (airData) {
      const fresh = generateDailyRoutine(airData, lang, DEFAULT_FAMILY_PROFILE);
      setActivities(fresh);
      persistState(DEFAULT_FAMILY_PROFILE, fresh, lang);
      setVerificationResult(null);
    }
  };

  const handleCopySchedule = () => {
    const text = effectiveActivities
      .map(
        (a) =>
          `[${a.period.toUpperCase()}] ${a.time} - ${a.activity} (${a.status.toUpperCase()}) [${a.location}]\n` +
          `• Action: ${a.recommendation}\n` +
          `• Explanation: ${a.explanation}\n` +
          `• Status: ${a.completed ? "COMPLETED" : "PENDING"}`
      )
      .join("\n\n");

    const aqiStr = activeStandard === "INDIA_CPCB" ? `${airData?.indiaAqi} (IN NAQI)` : `${airData?.usAqi} (US AQI)`;
    const header = `🌿 BreatheWise AI Daily Air Hygiene Routine\nCity: ${airData?.city.name} | AQI: ${aqiStr}\nCohort: ${profile.cohort.toUpperCase()}\n\n`;
    navigator.clipboard.writeText(header + text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Preset Selection
  const applyPreset = (preset: typeof PRESET_PLANS[0]) => {
    setPlanInput({
      activityName: preset.name,
      plannedTime: preset.time,
      durationMinutes: preset.duration,
      environment: preset.env,
      intensity: preset.intensity,
      cohort: preset.cohort,
      hasN95Mask: preset.mask,
    });
    setVerificationResult(null);
    setVerificationError(null);
  };

  // Submit Plan for AI Verification
  const handleVerifyPlan = async () => {
    if (!planInput.activityName.trim()) {
      setVerificationError(
        lang === "hi"
          ? "कृपया गतिविधि का नाम दर्ज करें।"
          : "Please enter an activity name (e.g. Morning 5km Run)."
      );
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const res = await fetch("/api/planner/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planInput,
          cityId: airData?.city?.id,
          lat: airData?.city?.lat,
          lon: airData?.city?.lon,
          standard: activeStandard,
          lang,
          aqiData: airData,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: PlanVerificationResult = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.warn("AI verification API error, falling back to local physics engine:", err);
      const fallbackAqiData: AirQualityData = {
        city: { id: "delhi", name: "New Delhi", region: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
        lastUpdated: new Date().toISOString(),
        clientFetchTimestamp: new Date().toISOString(),
        modelRunTimestamp: new Date().toISOString(),
        camsSource: "CAMS Grid",
        source: "Open-Meteo",
        sourceType: "MODELLED_CAMS_GRID",
        isCpcbGroundStation: false,
        cpcbDisclaimer: "Simulated fallback",
        dataNature: "Demo Data",
        calculationStandard: "India CPCB",
        activeStandard: "INDIA_CPCB",
        referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
        usAqi: 220,
        indiaAqi: 280,
        displayAqi: 280,
        category: "Very Unhealthy",
        indiaCategory: "Very Poor",
        displayCategory: "Very Poor",
        nowCastConcentration: 110,
        isNowCastCalculated: true,
        isDemoData: true,
        europeanAqi: 5,
        primaryPollutant: "PM2.5",
        healthSummary: "High air pollution alert",
        temperature: 22,
        humidity: 60,
        windSpeed: 5,
        weather: {
          code: 0,
          description: "Clear",
          iconName: "Sun",
          temperature: 22,
          feelsLike: 22,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          surfacePressure: 1013,
        },
        pollutants: {
          pm2_5: {
            code: "pm2_5",
            name: "PM2.5",
            chemicalFormula: "PM2.5",
            value: 110,
            unit: "µg/m³",
            whoLimit: 15,
            percentageOfLimit: 733,
            status: "Severe",
            description: "Elevated particulate matter",
          },
        },
        hourlyForecast: [],
        hourlyHistorical: [],
        inversionRisk: {
          level: "High",
          description: "Thermal inversion layer",
          tempInversion: true,
          windSpeed: 5,
          humidity: 60,
          trappedSmogProbability: 75,
        },
        recommendations: {
          general: "Avoid prolonged outdoor exposure.",
          vulnerable: "Stay indoors with HEPA air filtration.",
          outdoorActivity: "Reschedule vigorous workouts to midday or indoors.",
          ventilation: "Keep windows closed during early morning peaks.",
          maskRequired: true,
        },
      };
      const fallback = verifyPlanDeterministic(
        planInput,
        airData || fallbackAqiData,
        lang
      );
      setVerificationResult(fallback);
    } finally {
      setIsVerifying(false);
    }
  };

  // Add the verified plan to the active schedule
  const handleAddVerifiedPlanToRoutine = () => {
    if (!verificationResult) return;

    const currentList = activities.length > 0
      ? activities
      : (airData ? generateDailyRoutine(airData, lang, profile) : []);

    const newActivity: RoutineActivity = {
      id: `custom-${Date.now()}`,
      time: verificationResult.plannedTime,
      displayTime: verificationResult.plannedTime,
      period: verificationResult.period,
      activity: verificationResult.activityName,
      recommendation: `${verificationResult.verdict}: ${verificationResult.summary}${
        verificationResult.recommendedAdjustment ? ` (${verificationResult.recommendedAdjustment})` : ""
      }`,
      status: verificationResult.status,
      location: verificationResult.environment === "outdoor" ? "Outdoor" : "Indoor",
      explanation: verificationResult.explanation,
      language: lang,
      impactPoints: verificationResult.impactPoints,
      isCustom: true,
      safetyScore: verificationResult.safetyScore,
      protectiveMeasures: verificationResult.protectiveMeasures,
      suggestedAlternativeTime: verificationResult.suggestedAlternativeTime,
      estimatedInhaledDoseUg: verificationResult.estimatedInhaledDoseUg,
      completed: false,
    };

    const updated = [newActivity, ...currentList];
    setActivities(updated);
    persistState(profile, updated, lang);
    setAddedSuccess(newActivity.activity);
    setTimeout(() => setAddedSuccess(null), 3500);
  };

  // Delete a custom activity
  const handleDeleteCustomActivity = (id: string) => {
    const updated = effectiveActivities.filter((a) => a.id !== id);
    setActivities(updated);
    persistState(profile, updated, lang);
  };

  if (loading && !airData) {
    return (
      <PageTransition className="py-12">
        <LoadingState label="Synthesizing personalized AI schedule..." />
      </PageTransition>
    );
  }

  // Calculate completion and protection score
  const totalActions = effectiveActivities.length;
  const completedActions = effectiveActivities.filter((a) => a.completed).length;
  const protectionScore = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const morningActivities = effectiveActivities.filter((a) => a.period === "morning");
  const afternoonActivities = effectiveActivities.filter((a) => a.period === "afternoon");
  const eveningActivities = effectiveActivities.filter((a) => a.period === "evening");

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* 1. Header with Language Switcher and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F2F6FA] flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-[#4DB8FF]" />
            {lang === "hi" ? "दैनिक सुरक्षा योजनाकार" : "Daily Planner"}
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            {lang === "hi"
              ? `${airData?.city.name} के लाइव इनवर्जन व AQI डेटा पर आधारित व्यक्तिगत पारिवारिक सुरक्षा समय-सारणी।`
              : `Personalized, timed respiratory protection routines calibrated to ${airData?.city.name}'s diurnal atmospheric inversion.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] text-xs">
            <button
              onClick={() => handleLanguageSwitch("en")}
              className={cn(
                "px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer",
                lang === "en"
                  ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)] shadow-sm"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageSwitch("hi")}
              className={cn(
                "px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer",
                lang === "hi"
                  ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)] shadow-sm"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
            >
              हिंदी
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopySchedule}
            icon={copied ? <Check className="w-3.5 h-3.5 text-[#4DB8FF]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? (lang === "hi" ? "कॉपी हुआ" : "Copied") : (lang === "hi" ? "कॉपी" : "Export")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            icon={<Users className="w-3.5 h-3.5 text-[#4DB8FF]" />}
          >
            {lang === "hi" ? "पारिवारिक प्रोफ़ाइल" : "Family Profile"}
          </Button>

          <Badge variant="accent" dot>
            {airData?.city.name} ({activeStandard === "INDIA_CPCB" ? `IN NAQI ${airData?.indiaAqi}` : `US AQI ${airData?.usAqi}`})
          </Badge>
        </div>
      </div>

      {/* 2. Interactive Protection Progress Tracker */}
      <Card elevated className="p-4 md:p-5 rounded-3xl bg-[rgba(18,29,42,0.65)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[rgba(77,184,255,0.12)] border border-[rgba(77,184,255,0.25)] flex items-center justify-center text-[#4DB8FF]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F2F6FA] flex items-center gap-2">
                <span>{lang === "hi" ? "आज का वायु सुरक्षा स्कोर" : "Daily Protection Score"}</span>
                <span className="text-[#4DB8FF] font-extrabold">{protectionScore}%</span>
              </div>
              <p className="text-xs text-[#A3B3C2]">
                {lang === "hi"
                  ? `${totalActions} में से ${completedActions} सुरक्षात्मक क्रियाएं पूरी की गईं`
                  : `${completedActions} of ${totalActions} protective actions completed`}
              </p>
            </div>
          </div>

          <div className="text-right flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#8496A8] uppercase tracking-wider font-semibold">
              Cohort: {profile.cohort}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              title="Reset checklist to uncompleted"
              icon={<RotateCcw className="w-3 h-3 text-[#A3B3C2]" />}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${protectionScore}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#4DB8FF] to-[#38BDF8] rounded-full shadow-[0_0_12px_rgba(77,184,255,0.4)]"
          />
        </div>
      </Card>

      {/* 3. Family Profile Inputs (Collapsible Drawer / Card) */}
      <AnimatePresence>
        {showProfileDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card elevated className="p-5 md:p-6 rounded-3xl space-y-4 border-[rgba(77,184,255,0.25)]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4DB8FF]" />
                  <h3 className="text-sm font-bold text-[#F2F6FA]">
                    {lang === "hi" ? "पारिवारिक प्रोफ़ाइल व आवागमन सेटिंग" : "Family Profile & Commute Configuration"}
                  </h3>
                </div>
                <span className="text-xs text-[#4DB8FF] font-semibold">
                  Personalized Algorithm
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Cohort Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                    Primary Household Cohort
                  </label>
                  <select
                    value={profile.cohort}
                    onChange={(e) => {
                      const updated = {
                        ...profile,
                        cohort: e.target.value as FamilyProfileInput["cohort"],
                        hasKids: e.target.value === "family" || e.target.value === "infant",
                        hasRespiratory: e.target.value === "asthma",
                        hasElderly: e.target.value === "elderly",
                      };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="w-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] focus:outline-none focus:border-[#4DB8FF]"
                  >
                    <option value="family">Family with Children (General)</option>
                    <option value="infant">Infant / Toddler (Pediatric Guard)</option>
                    <option value="asthma">Asthma / Bronchial Sensitivity</option>
                    <option value="elderly">Elderly / Cardiovascular Risk</option>
                    <option value="runner">Outdoor Athlete / Runner</option>
                  </select>
                </div>

                {/* Commute Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                    Commute Transportation Mode
                  </label>
                  <select
                    value={profile.commuteMode}
                    onChange={(e) => {
                      const updated = {
                        ...profile,
                        commuteMode: e.target.value as FamilyProfileInput["commuteMode"],
                      };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="w-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] focus:outline-none focus:border-[#4DB8FF]"
                  >
                    <option value="metro">Electric Metro / Rail (Protected)</option>
                    <option value="carpool">Carpool (AC Recirculate)</option>
                    <option value="car">Private Car (AC Recirculate)</option>
                    <option value="bike">Two-Wheeler / Motorbike (Exposed)</option>
                    <option value="walk">Walking / Bicycle Commute</option>
                  </select>
                </div>

                {/* Commute Times */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                      Morning Leave
                    </label>
                    <input
                      type="text"
                      value={profile.morningDeparture || "08:00 AM"}
                      aria-label="Morning departure time"
                      onChange={(e) => {
                        const updated = { ...profile, morningDeparture: e.target.value };
                        setProfile(updated);
                        handleRegenerate(updated);
                      }}
                      className="w-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                      Evening Return
                    </label>
                    <input
                      type="text"
                      value={profile.eveningReturn || "06:30 PM"}
                      aria-label="Evening return time"
                      onChange={(e) => {
                        const updated = { ...profile, eveningReturn: e.target.value };
                        setProfile(updated);
                        handleRegenerate(updated);
                      }}
                      className="w-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[rgba(10,17,24,0.4)]">
                  <input
                    type="checkbox"
                    checked={profile.hasAirPurifier}
                    onChange={(e) => {
                      const updated = { ...profile, hasAirPurifier: e.target.checked };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="accent-[#4DB8FF]"
                  />
                  <span>HEPA Air Purifier</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[rgba(10,17,24,0.4)]">
                  <input
                    type="checkbox"
                    checked={profile.hasN95Mask}
                    onChange={(e) => {
                      const updated = { ...profile, hasN95Mask: e.target.checked };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="accent-[#4DB8FF]"
                  />
                  <span>N95 Respirators</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[rgba(10,17,24,0.4)]">
                  <input
                    type="checkbox"
                    checked={profile.hasKids}
                    onChange={(e) => {
                      const updated = { ...profile, hasKids: e.target.checked };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="accent-[#4DB8FF]"
                  />
                  <span>Children at Home</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[rgba(10,17,24,0.4)]">
                  <input
                    type="checkbox"
                    checked={profile.hasRespiratory}
                    onChange={(e) => {
                      const updated = { ...profile, hasRespiratory: e.target.checked };
                      setProfile(updated);
                      handleRegenerate(updated);
                    }}
                    className="accent-[#4DB8FF]"
                  />
                  <span>Respiratory History</span>
                </label>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. AI ACTIVITY PLANNER & SAFETY VERIFIER (FEATURED HERO CARD) */}
      <Card
        elevated
        className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-[rgba(18,29,42,0.85)] via-[rgba(12,20,30,0.9)] to-[rgba(18,29,42,0.85)] border border-[rgba(77,184,255,0.3)] shadow-[0_8px_32px_rgba(77,184,255,0.08)] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[rgba(255,255,255,0.08)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#4DB8FF]/20 to-[#38BDF8]/10 border border-[#4DB8FF]/30 flex items-center justify-center text-[#4DB8FF]">
              <Sparkles className="w-5 h-5 text-[#4DB8FF] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F2F6FA]">
                  {lang === "hi" ? "AI योजना सत्यापनकर्ता" : "AI Activity Safety Verifier"}
                </h2>
                <Badge variant="accent" size="sm">
                  Gemini & Diurnal Physics
                </Badge>
              </div>
              <p className="text-xs text-[#A3B3C2] mt-0.5">
                {lang === "hi"
                  ? "अपनी किसी भी बाहरी या इनडोर योजना को दर्ज करें और लाइव AQI, इनवर्जन व श्वास गति के आधार पर AI से सत्यापित कराएं।"
                  : "Input your custom outdoor or indoor plan and verify respiratory safety against live diurnal inversion, PM2.5, and minute ventilation."}
              </p>
            </div>
          </div>

          <span className="text-xs text-[#4DB8FF] font-semibold self-start sm:self-auto bg-[rgba(77,184,255,0.08)] px-2.5 py-1 rounded-full border border-[rgba(77,184,255,0.2)]">
            Physiological Inhaled Dose Model
          </span>
        </div>

        {/* 4.1 Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#8496A8] uppercase tracking-wider">
            {lang === "hi" ? "त्वरित परिदृश्य चुनें:" : "Quick Demo Scenarios:"}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_PLANS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 text-xs rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(77,184,255,0.15)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(77,184,255,0.3)] text-[#D5E2EE] transition-all cursor-pointer font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4.2 Interactive Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Activity Name */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#4DB8FF]" />
              {lang === "hi" ? "गतिविधि का नाम" : "Planned Activity"}
            </label>
            <input
              type="text"
              value={planInput.activityName}
              aria-label={lang === "hi" ? "गतिविधि का नाम" : "Planned Activity Name"}
              onChange={(e) => setPlanInput({ ...planInput, activityName: e.target.value })}
              placeholder={
                lang === "hi"
                  ? "उदा. सुबह की 5 किमी दौड़, बच्चों का फुटबॉल मैच..."
                  : "e.g. Morning 5km run in park, soccer practice, cycling commute..."
              }
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3.5 py-2.5 text-xs text-[#F2F6FA] placeholder:text-[#64748B] focus:outline-none transition-all"
            />
          </div>

          {/* Planned Time */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              {lang === "hi" ? "समय" : "Time"}
            </label>
            <select
              value={planInput.plannedTime}
              onChange={(e) => setPlanInput({ ...planInput, plannedTime: e.target.value })}
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3 py-2.5 text-xs text-[#F2F6FA] focus:outline-none"
            >
              <option value="06:00 AM">06:00 AM (Early Inversion)</option>
              <option value="07:00 AM">07:00 AM (Morning Peak)</option>
              <option value="08:30 AM">08:30 AM (Rush Hour)</option>
              <option value="11:00 AM">11:00 AM (PBL Rising)</option>
              <option value="01:30 PM">01:30 PM (Midday Optimal)</option>
              <option value="04:30 PM">04:30 PM (Pre-Sunset)</option>
              <option value="06:30 PM">06:30 PM (Evening Peak)</option>
              <option value="08:30 PM">08:30 PM (Night Inversion)</option>
            </select>
          </div>

          {/* Duration */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
              {lang === "hi" ? "अवधि" : "Duration"}
            </label>
            <select
              value={planInput.durationMinutes}
              onChange={(e) =>
                setPlanInput({ ...planInput, durationMinutes: Number(e.target.value) })
              }
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3 py-2.5 text-xs text-[#F2F6FA] focus:outline-none"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
              <option value={120}>2 Hours</option>
            </select>
          </div>

          {/* Environment */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#34D399]" />
              {lang === "hi" ? "स्थान / वातावरण" : "Environment"}
            </label>
            <select
              value={planInput.environment}
              onChange={(e) =>
                setPlanInput({
                  ...planInput,
                  environment: e.target.value as UserPlanInput["environment"],
                })
              }
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3 py-2.5 text-xs text-[#F2F6FA] focus:outline-none"
            >
              <option value="outdoor">Outdoor (Ambient Exposure)</option>
              <option value="indoor_hepa">Indoor (HEPA H13 Filtered)</option>
              <option value="indoor_unfiltered">Indoor (Standard / Open Windows)</option>
              <option value="transit">Transit / Commute (Car / Rail)</option>
            </select>
          </div>
        </div>

        {/* 4.3 Second Row: Intensity, Cohort, Mask, & Submit */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs pt-1">
          {/* Exertion Intensity */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-[#F43F5E]" />
              {lang === "hi" ? "व्यायाम की तीव्रता" : "Exertion Intensity"}
            </label>
            <select
              value={planInput.intensity}
              onChange={(e) =>
                setPlanInput({
                  ...planInput,
                  intensity: e.target.value as UserPlanInput["intensity"],
                })
              }
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3 py-2 text-xs text-[#F2F6FA] focus:outline-none"
            >
              <option value="light">Light (~10 L/min: Casual stroll, dining)</option>
              <option value="moderate">Moderate (~25 L/min: Brisk walk, light chores)</option>
              <option value="vigorous">Vigorous (~65 L/min: Running, cardio, sports)</option>
            </select>
          </div>

          {/* Cohort */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-[#8496A8] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              {lang === "hi" ? "प्रतिभागी समूह" : "Participant Cohort"}
            </label>
            <select
              value={planInput.cohort}
              onChange={(e) =>
                setPlanInput({
                  ...planInput,
                  cohort: e.target.value as UserPlanInput["cohort"],
                })
              }
              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.1)] focus:border-[#4DB8FF] rounded-2xl px-3 py-2 text-xs text-[#F2F6FA] focus:outline-none"
            >
              <option value="general">General Healthy Adult</option>
              <option value="kids">School-age Child</option>
              <option value="infant">Infant / Toddler (&lt;3 yrs)</option>
              <option value="asthma">Asthma / Bronchial Sensitive</option>
              <option value="elderly">Elderly / Cardiovascular Risk</option>
              <option value="athlete">Endurance Athlete / Runner</option>
            </select>
          </div>

          {/* Mask Toggle */}
          <div className="md:col-span-2 pt-4">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-2xl bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(77,184,255,0.3)] transition-colors">
              <input
                type="checkbox"
                checked={planInput.hasN95Mask}
                onChange={(e) => setPlanInput({ ...planInput, hasN95Mask: e.target.checked })}
                className="accent-[#4DB8FF]"
              />
              <span className="text-xs font-medium text-[#F2F6FA]">
                {lang === "hi" ? "N95 मास्क" : "N95 Respirator"}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex items-center gap-2 pt-4">
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:from-[#0369A1] hover:to-[#0284C7] text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] text-xs font-bold py-2.5 px-4 rounded-2xl cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleVerifyPlan}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{lang === "hi" ? "सत्यापन जारी..." : "Verifying Plan..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{lang === "hi" ? "AI से सत्यापित करें" : "Verify with AI"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {verificationError && (
          <div className="p-3 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[#FCA5A5] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
            <span>{verificationError}</span>
          </div>
        )}

        {/* 4.4 Verification Result Card */}
        <AnimatePresence>
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-5 md:p-6 rounded-3xl bg-[rgba(10,17,24,0.85)] border border-[rgba(77,184,255,0.35)] shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4"
            >
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      verificationResult.status === "avoid"
                        ? "danger"
                        : verificationResult.status === "caution"
                        ? "warning"
                        : verificationResult.status === "optimal"
                        ? "accent"
                        : "subtle"
                    }
                    size="md"
                    className="text-xs px-3 py-1 font-bold tracking-wide uppercase"
                  >
                    {verificationResult.status === "avoid"
                      ? "🛑 " + (lang === "hi" ? "उच्च जोखिम" : "HIGH RISK / AVOID")
                      : verificationResult.status === "caution"
                      ? "⚠️ " + (lang === "hi" ? "सतर्कता आवश्यक" : "PROCEED WITH CAUTION")
                      : verificationResult.status === "optimal"
                      ? "✨ " + (lang === "hi" ? "सर्वोत्तम समय" : "OPTIMAL WINDOW")
                      : "✅ " + (lang === "hi" ? "सुरक्षित" : "SAFE")}
                  </Badge>

                  <div>
                    <h3 className="text-sm font-bold text-[#F2F6FA]">
                      {verificationResult.verdict}
                    </h3>
                    <p className="text-xs text-[#8496A8]">
                      {verificationResult.plannedTime} • {verificationResult.activityName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[11px] text-[#8496A8] block">Safety Index</span>
                    <span
                      className={cn(
                        "text-lg font-black",
                        verificationResult.safetyScore >= 80
                          ? "text-[#34D399]"
                          : verificationResult.safetyScore >= 55
                          ? "text-[#FBBF24]"
                          : "text-[#F87171]"
                      )}
                    >
                      {verificationResult.safetyScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Summary & Clinical Explanation */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#E2E8F0] leading-relaxed">
                  {verificationResult.summary}
                </p>
                <div className="p-3.5 rounded-2xl bg-[rgba(18,29,42,0.6)] border border-[rgba(255,255,255,0.06)] text-xs text-[#A3B3C2] leading-relaxed space-y-1.5">
                  <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>
                      {lang === "hi"
                        ? "वायुमंडलीय इनवर्जन व फेफड़ों पर प्रभाव (Clinical Mechanism):"
                        : "Atmospheric Inversion & Alveolar Deposition Analysis:"}
                    </span>
                  </div>
                  <p>{verificationResult.explanation}</p>
                </div>
              </div>

              {/* Physiological Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-[rgba(14,23,34,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
                  <span className="text-[11px] text-[#8496A8] uppercase tracking-wider font-semibold block">
                    Estimated Inhaled PM2.5
                  </span>
                  <div className="text-base font-extrabold text-[#4DB8FF] flex items-baseline gap-1">
                    <span>{verificationResult.estimatedInhaledDoseUg}</span>
                    <span className="text-xs font-normal text-[#8496A8]">µg particulate dose</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block">
                    Based on {planInput.intensity} exertion rate
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[rgba(14,23,34,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
                  <span className="text-[11px] text-[#8496A8] uppercase tracking-wider font-semibold block">
                    WHO Benchmark Intake
                  </span>
                  <div className="text-xs font-bold text-[#F2F6FA] leading-tight">
                    {verificationResult.whoGuidelineComparison}
                  </div>
                  <span className="text-[10px] text-[#64748B] block">
                    24h WHO reference: 15 µg/m³
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[rgba(14,23,34,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
                  <span className="text-[11px] text-[#8496A8] uppercase tracking-wider font-semibold block">
                    Shielding & Filtration
                  </span>
                  <div className="text-xs font-bold text-[#34D399] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {planInput.hasN95Mask
                        ? "N95 Sealed (~85% blocked)"
                        : planInput.environment === "indoor_hepa"
                        ? "HEPA H13 Filtered"
                        : "Zero Particle Shield"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block">
                    Cohort: {verificationResult.cohort.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Recommended Adjustment (If any) */}
              {verificationResult.recommendedAdjustment && (
                <div className="p-3.5 rounded-2xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] flex items-start gap-2.5 text-xs text-[#FDE68A]">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">
                      {lang === "hi" ? "AI अनुशंसित अनुकूलन (Optimal Alternative):" : "Recommended Adjustment & Timing:"}
                    </span>
                    <p className="leading-relaxed">{verificationResult.recommendedAdjustment}</p>
                  </div>
                </div>
              )}

              {/* Actionable Protective Measures */}
              {verificationResult.protectiveMeasures &&
                verificationResult.protectiveMeasures.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-[#8496A8] uppercase tracking-wider block">
                      {lang === "hi" ? "अनिवार्य सुरक्षात्मक उपाय:" : "Mandatory Protective Directives:"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {verificationResult.protectiveMeasures.map((measure, mIdx) => (
                        <div
                          key={mIdx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[#E2E8F0]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                          <span>{measure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* CTA: Add to Today's Routine */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <div className="text-xs text-[#8496A8]">
                  {lang === "hi"
                    ? "सत्यापित गतिविधि को दिनचर्या में जोड़ें और अपनी दैनिक सुरक्षा ट्रैक करें।"
                    : "Add verified plan to your daily schedule checklist with progress tracking."}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddVerifiedPlanToRoutine}
                    className="inline-flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === "hi" ? "आज की दिनचर्या में जोड़ें" : "Add to Today's Routine"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Added Toast Notification */}
        {addedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-2xl bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-xs text-[#6EE7B7] flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>
              {lang === "hi"
                ? `'${addedSuccess}' को आपकी दैनिक समय-सारणी में जोड़ दिया गया है!`
                : `Successfully added '${addedSuccess}' to your schedule checklist!`}
            </span>
          </motion.div>
        )}
      </Card>

      {/* 5. Three Period Routines: Morning, Afternoon, Evening */}
      <div className="space-y-6">
        {/* SECTION 1: MORNING ROUTINE */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4DB8FF] border-b border-[rgba(255,255,255,0.06)] pb-2">
            <Sunrise className="w-4 h-4" />
            <span>{lang === "hi" ? "प्रातःकालीन दिनचर्या (06:00 AM – 11:30 AM)" : "Morning Interval (06:00 AM – 11:30 AM)"}</span>
            <span className="text-xs text-[#8496A8] font-normal normal-case ml-auto">
              {lang === "hi" ? "उच्च प्रदूषण पीक समय" : "High Smog Peak"}
            </span>
          </div>

          <div className="space-y-3">
            {morningActivities.length > 0 ? (
              morningActivities.map((act) => renderRoutineCard(act))
            ) : (
              <p className="text-xs text-[#64748B] italic p-3">No morning activities scheduled.</p>
            )}
          </div>
        </div>

        {/* SECTION 2: AFTERNOON WINDOW */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38BDF8] border-b border-[rgba(255,255,255,0.06)] pb-2">
            <Sun className="w-4 h-4" />
            <span>{lang === "hi" ? "दोपहर का समय (12:00 PM – 04:30 PM)" : "Afternoon Window (12:00 PM – 04:30 PM)"}</span>
            <span className="text-xs text-[#8496A8] font-normal normal-case ml-auto">
              {lang === "hi" ? "सर्वोत्तम वेंटिलेशन समय" : "Optimal Air Window"}
            </span>
          </div>

          <div className="space-y-3">
            {afternoonActivities.length > 0 ? (
              afternoonActivities.map((act) => renderRoutineCard(act))
            ) : (
              <p className="text-xs text-[#64748B] italic p-3">No afternoon activities scheduled.</p>
            )}
          </div>
        </div>

        {/* SECTION 3: EVENING & NIGHT PROTOCOL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A78BFA] border-b border-[rgba(255,255,255,0.06)] pb-2">
            <Moon className="w-4 h-4" />
            <span>{lang === "hi" ? "सायंकालीन व रात्रि समय (05:00 PM – 10:00 PM+)" : "Evening & Night (05:00 PM – 10:00 PM+)"}</span>
            <span className="text-xs text-[#8496A8] font-normal normal-case ml-auto">
              {lang === "hi" ? "इनडोर एयर सीलिंग" : "Indoor HEPA Protocol"}
            </span>
          </div>

          <div className="space-y-3">
            {eveningActivities.length > 0 ? (
              eveningActivities.map((act) => renderRoutineCard(act))
            ) : (
              <p className="text-xs text-[#64748B] italic p-3">No evening activities scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );

  function renderRoutineCard(act: RoutineActivity) {
    const isDone = Boolean(act.completed);
    const isExpanded = Boolean(expandedExplanation[act.id]);

    const statusBadgeVariant =
      act.status === "avoid"
        ? "danger"
        : act.status === "caution"
        ? "warning"
        : act.status === "optimal"
        ? "accent"
        : "subtle";

    const statusLabel =
      act.status === "avoid"
        ? `Avoid ${act.location}`
        : act.status === "caution"
        ? `Caution (${act.location})`
        : act.status === "optimal"
        ? `Safe (${act.location})`
        : "Safe";

    return (
      <Card
        key={act.id}
        elevated
        hoverEffect
        className={cn(
          "p-4 md:p-5 rounded-3xl transition-all border",
          isDone
            ? "bg-[rgba(14,23,34,0.75)] border-[rgba(77,184,255,0.3)] shadow-[0_4px_16px_rgba(77,184,255,0.08)]"
            : "bg-[rgba(14,23,34,0.6)] border-[rgba(255,255,255,0.07)]",
          act.isCustom && "border-l-4 border-l-[#4DB8FF]"
        )}
      >
        <div className="flex items-start gap-3.5">
          {/* Action Completion Checkbox */}
          <button
            onClick={() => toggleActionCompleted(act.id)}
            className="mt-1 shrink-0 p-1 rounded-xl text-[#A3B3C2] hover:text-[#4DB8FF] transition-colors cursor-pointer"
            aria-label={isDone ? "Mark pending" : "Mark completed"}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-[#4DB8FF]" />
            ) : (
              <Circle className="w-5 h-5 text-[#8496A8] hover:text-[#4DB8FF]" />
            )}
          </button>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#F2F6FA] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4DB8FF]" />
                  {act.time}
                </span>
                <span className="text-sm font-semibold text-[#F2F6FA]">
                  {act.activity}
                </span>
                {act.isCustom && (
                  <Badge variant="accent" size="sm" className="text-[10px] py-0 px-2">
                    AI Verified Plan
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant} size="sm">
                  {statusLabel}
                </Badge>

                {act.isCustom && (
                  <button
                    onClick={() => handleDeleteCustomActivity(act.id)}
                    className="p-1 rounded-lg text-[#8496A8] hover:text-[#F87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
                    title="Remove custom plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Recommendation Directive */}
            <p
              className={cn(
                "text-xs leading-relaxed",
                isDone ? "text-[#A3B3C2] line-through opacity-80" : "text-[#E6EDE8] font-medium"
              )}
            >
              {act.recommendation}
            </p>

            {/* Scientific Explanation Toggle Button */}
            <div className="pt-1">
              <button
                onClick={() => toggleExplanation(act.id)}
                className="flex items-center gap-1 text-xs font-semibold text-[#4DB8FF] hover:text-[#7CCBFF] cursor-pointer transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>
                  {isExpanded
                    ? lang === "hi" ? "कारण विवरण छिपाएं" : "Hide Medical Rationale"
                    : lang === "hi" ? "कारण विवरण देखें" : "Why this recommendation?"}
                </span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Collapsible Scientific & Physiological Explanation */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 rounded-2xl bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs text-[#A3B3C2] leading-relaxed">
                      <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Clinical & Atmospheric Mechanism:</span>
                      </div>
                      <p>{act.explanation}</p>

                      {act.estimatedInhaledDoseUg !== undefined && (
                        <div className="text-[11px] text-[#8496A8] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                          Estimated pulmonary PM2.5 deposition: <strong className="text-[#4DB8FF]">{act.estimatedInhaledDoseUg} µg</strong>
                        </div>
                      )}

                      {act.protectiveMeasures && act.protectiveMeasures.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-[rgba(255,255,255,0.06)]">
                          <span className="font-semibold text-[#F2F6FA] text-[11px]">Directives:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#CBD5E1]">
                            {act.protectiveMeasures.map((pm, i) => (
                              <li key={i}>{pm}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    );
  }
}
