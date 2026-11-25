"use client";

import React, { useState, useMemo } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { FamilyProfileDrawer } from "@/components/planner/FamilyProfileDrawer";
import {
  ActivitySafetyVerifier,
  type PresetPlan,
} from "@/components/planner/ActivitySafetyVerifier";
import { RoutineTimelineSection } from "@/components/planner/RoutineTimelineSection";
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
import { createFallbackAirQualityData } from "@/lib/fallback-aqi";
import { readStorageJson, writeStorageJson } from "@/lib/storage";
import { logger } from "@/lib/logger";

const PLANNER_STORAGE_KEY = "breathewise_planner_data_v2";

interface StoredPlannerState {
  profile?: FamilyProfileInput;
  activities?: RoutineActivity[];
  lang?: "en" | "hi";
}

function getInitialCohort(profile: FamilyProfileInput): UserPlanInput["cohort"] {
  if (profile.cohort === "asthma" || profile.cohort === "infant") return profile.cohort;
  return profile.hasKids ? "kids" : "general";
}

export default function PlannerPage() {
  const { airData, loading, activeStandard } = useAirQuality();

  const [lang, setLang] = useState<"en" | "hi">(() => {
    const saved = readStorageJson<StoredPlannerState>(PLANNER_STORAGE_KEY, {});
    return saved.lang === "hi" ? "hi" : "en";
  });

  const [profile, setProfile] = useState<FamilyProfileInput>(() => {
    const saved = readStorageJson<StoredPlannerState>(PLANNER_STORAGE_KEY, {});
    return saved.profile || DEFAULT_FAMILY_PROFILE;
  });

  const [activities, setActivities] = useState<RoutineActivity[]>(() => {
    const saved = readStorageJson<StoredPlannerState>(PLANNER_STORAGE_KEY, {});
    return saved.activities && saved.activities.length > 0 ? saved.activities : [];
  });

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [planInput, setPlanInput] = useState<UserPlanInput>(() => ({
    activityName: "",
    plannedTime: "07:00 AM",
    durationMinutes: 45,
    environment: "outdoor",
    intensity: "vigorous",
    cohort: getInitialCohort(profile),
    hasN95Mask: false,
  }));
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PlanVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  const effectiveActivities = useMemo(() => {
    if (activities.length > 0) return activities;
    return airData ? generateDailyRoutine(airData, lang, profile) : [];
  }, [activities, airData, lang, profile]);

  const persistState = (prof: FamilyProfileInput, acts: RoutineActivity[], l: "en" | "hi") => {
    writeStorageJson(PLANNER_STORAGE_KEY, { profile: prof, activities: acts, lang: l });
  };

  const handleRegenerate = (customProfile?: FamilyProfileInput, targetLang?: "en" | "hi") => {
    if (!airData) return;
    const activeProf = customProfile || profile;
    const activeLang = targetLang || lang;
    const fresh = generateDailyRoutine(airData, activeLang, activeProf);
    const customActivities = effectiveActivities.filter((a) => a.isCustom);
    const combined = [...customActivities, ...fresh];
    setActivities(combined);
    persistState(activeProf, combined, activeLang);
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
    if (!airData) return;
    const fresh = generateDailyRoutine(airData, lang, DEFAULT_FAMILY_PROFILE);
    setActivities(fresh);
    persistState(DEFAULT_FAMILY_PROFILE, fresh, lang);
    setVerificationResult(null);
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

    const aqiStr =
      activeStandard === "INDIA_CPCB" ? `${airData?.indiaAqi} (IN NAQI)` : `${airData?.usAqi} (US AQI)`;
    const header = `🌿 BreatheWise AI Daily Air Hygiene Routine\nCity: ${airData?.city.name} | AQI: ${aqiStr}\nCohort: ${profile.cohort.toUpperCase()}\n\n`;
    navigator.clipboard.writeText(header + text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

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
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: PlanVerificationResult = await res.json();
      setVerificationResult(data);
    } catch (err) {
      logger.warn("PlannerVerify", err);
      setVerificationResult(
        verifyPlanDeterministic(planInput, airData || createFallbackAirQualityData(), lang)
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddVerifiedPlanToRoutine = () => {
    if (!verificationResult) return;

    const currentList =
      activities.length > 0
        ? activities
        : airData
        ? generateDailyRoutine(airData, lang, profile)
        : [];

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

  const totalActions = effectiveActivities.length;
  const completedActions = effectiveActivities.filter((a) => a.completed).length;
  const protectionScore = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const sections = [
    {
      period: "morning" as const,
      title: lang === "hi" ? "प्रातःकालीन दिनचर्या (06:00 AM – 11:30 AM)" : "Morning Interval (06:00 AM – 11:30 AM)",
      subtitle: lang === "hi" ? "उच्च प्रदूषण पीक समय" : "High Smog Peak",
      emptyLabel: "No morning activities scheduled.",
      accentClassName: "text-[#4DB8FF]",
      icon: <Sunrise className="w-4 h-4" />,
      items: effectiveActivities.filter((a) => a.period === "morning"),
    },
    {
      period: "afternoon" as const,
      title: lang === "hi" ? "दोपहर का समय (12:00 PM – 04:30 PM)" : "Afternoon Window (12:00 PM – 04:30 PM)",
      subtitle: lang === "hi" ? "सर्वोत्तम वेंटिलेशन समय" : "Optimal Air Window",
      emptyLabel: "No afternoon activities scheduled.",
      accentClassName: "text-[#38BDF8]",
      icon: <Sun className="w-4 h-4" />,
      items: effectiveActivities.filter((a) => a.period === "afternoon"),
    },
    {
      period: "evening" as const,
      title: lang === "hi" ? "सायंकालीन व रात्रि समय (05:00 PM – 10:00 PM+)" : "Evening & Night (05:00 PM – 10:00 PM+)",
      subtitle: lang === "hi" ? "इनडोर एयर सीलिंग" : "Indoor HEPA Protocol",
      emptyLabel: "No evening activities scheduled.",
      accentClassName: "text-[#A78BFA]",
      icon: <Moon className="w-4 h-4" />,
      items: effectiveActivities.filter((a) => a.period === "evening"),
    },
  ];

  return (
    <PageTransition className="space-y-6 pb-12">
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
          <LanguageToggle lang={lang} onChange={handleLanguageSwitch} />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopySchedule}
            icon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-[#4DB8FF]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )
            }
          >
            {copied ? (lang === "hi" ? "कॉपी हुआ" : "Copied") : lang === "hi" ? "कॉपी" : "Export"}
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
            {airData?.city.name} (
            {activeStandard === "INDIA_CPCB" ? `IN NAQI ${airData?.indiaAqi}` : `US AQI ${airData?.usAqi}`})
          </Badge>
        </div>
      </div>

      {/* Protection Progress Tracker */}
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

        <div className="w-full bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${protectionScore}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#4DB8FF] to-[#38BDF8] rounded-full shadow-[0_0_12px_rgba(77,184,255,0.4)]"
          />
        </div>
      </Card>

      <FamilyProfileDrawer
        isOpen={showProfileDrawer}
        profile={profile}
        lang={lang}
        onProfileChange={(updated) => {
          setProfile(updated);
          handleRegenerate(updated);
        }}
      />

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

      <div className="space-y-6">
        {sections.map((sec) => (
          <RoutineTimelineSection
            key={sec.period}
            title={sec.title}
            subtitle={sec.subtitle}
            emptyLabel={sec.emptyLabel}
            accentClassName={sec.accentClassName}
            icon={sec.icon}
            activities={sec.items}
            expandedExplanation={expandedExplanation}
            lang={lang}
            onToggleCompleted={toggleActionCompleted}
            onToggleExplanation={toggleExplanation}
            onDeleteCustom={handleDeleteCustomActivity}
          />
        ))}
      </div>
    </PageTransition>
  );
}
