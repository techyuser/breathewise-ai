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
  ShieldCheck,
  Copy,
  Check,
  Sun,
  Sunrise,
  Moon,
  Users,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
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
import { RoutineCard } from "@/components/planner/RoutineCard";
import { FamilyProfileDrawer } from "@/components/planner/FamilyProfileDrawer";
import {
  ActivitySafetyVerifier,
  type PresetPlan,
} from "@/components/planner/ActivitySafetyVerifier";

const PLANNER_STORAGE_KEY = "breathewise_planner_data_v2";

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
  const applyPreset = (preset: PresetPlan) => {
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
      <FamilyProfileDrawer
        isOpen={showProfileDrawer}
        profile={profile}
        lang={lang}
        onProfileChange={(updated) => {
          setProfile(updated);
          handleRegenerate(updated);
        }}
      />

      {/* 4. AI ACTIVITY PLANNER & SAFETY VERIFIER */}
      <ActivitySafetyVerifier
        planInput={planInput}
        setPlanInput={setPlanInput}
        isVerifying={isVerifying}
        verificationResult={verificationResult}
        verificationError={verificationError}
        addedSuccess={addedSuccess}
        lang={lang}
        onApplyPreset={applyPreset}
        onVerifyPlan={handleVerifyPlan}
        onAddVerifiedPlanToRoutine={handleAddVerifiedPlanToRoutine}
      />

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
    return (
      <RoutineCard
        key={act.id}
        act={act}
        isExpanded={Boolean(expandedExplanation[act.id])}
        lang={lang}
        onToggleCompleted={toggleActionCompleted}
        onToggleExplanation={toggleExplanation}
        onDeleteCustom={handleDeleteCustomActivity}
      />
    );
  }
}
