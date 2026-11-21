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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  generateDailyRoutine,
  FamilyProfileInput,
  RoutineActivity,
  DEFAULT_FAMILY_PROFILE,
} from "@/lib/intelligence/routine-generator";
import { cn } from "@/lib/utils";

const PLANNER_STORAGE_KEY = "breathewise_planner_data_v2";

export default function PlannerPage() {
  const { airData, loading, activeStandard } = useAirQuality();

  const [lang, setLang] = useState<"en" | "hi">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lang) return parsed.lang;
        }
      } catch {
        // ignore
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
      } catch {
        // ignore
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
          if (parsed.activities && parsed.activities.length > 0) return parsed.activities;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // Compute effective activities: either user-modified/persisted or freshly synthesized from airData
  const effectiveActivities = useMemo(() => {
    if (activities.length > 0) return activities;
    if (airData) return generateDailyRoutine(airData, lang, profile);
    return [];
  }, [activities, airData, lang, profile]);

  // Regenerate when language or profile updates
  const handleRegenerate = (customProfile?: FamilyProfileInput, targetLang?: "en" | "hi") => {
    if (!airData) return;
    const activeProf = customProfile || profile;
    const activeL = targetLang || lang;
    const fresh = generateDailyRoutine(airData, activeL, activeProf);
    setActivities(fresh);
    persistState(activeProf, fresh, activeL);
  };

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

      {/* 4. Three Period Routines: Morning, Afternoon, Evening */}
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
            {morningActivities.map((act) => renderRoutineCard(act))}
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
            {afternoonActivities.map((act) => renderRoutineCard(act))}
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
            {eveningActivities.map((act) => renderRoutineCard(act))}
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
            : "bg-[rgba(14,23,34,0.6)] border-[rgba(255,255,255,0.07)]"
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
              </div>

              <Badge variant={statusBadgeVariant} size="sm">
                {statusLabel}
              </Badge>
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
                    <div className="p-3 rounded-2xl bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)] space-y-1 text-xs text-[#A3B3C2] leading-relaxed">
                      <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Clinical & Atmospheric Mechanism:</span>
                      </div>
                      <p>{act.explanation}</p>
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
