"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Activity,
  Clock,
  Layers,
  Wind,
  HeartPulse,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { UserPlanInput, PlanVerificationResult } from "@/lib/intelligence/plan-verifier";

export interface PresetPlan {
  label: string;
  name: string;
  time: string;
  duration: number;
  env: "outdoor" | "indoor_hepa" | "indoor_unfiltered" | "transit";
  intensity: "light" | "moderate" | "vigorous";
  cohort: "general" | "kids" | "infant" | "asthma" | "elderly" | "athlete";
  mask: boolean;
}

export const PRESET_PLANS: PresetPlan[] = [
  {
    label: "🏃 5K Morning Run",
    name: "Morning 5K Outdoor Run",
    time: "07:00 AM",
    duration: 45,
    env: "outdoor",
    intensity: "vigorous",
    cohort: "athlete",
    mask: false,
  },
  {
    label: "⚽ Kids Football Practice",
    name: "Kids Outdoor Football Practice",
    time: "04:30 PM",
    duration: 60,
    env: "outdoor",
    intensity: "vigorous",
    cohort: "kids",
    mask: false,
  },
  {
    label: "🚲 Bike Commute",
    name: "Two-Wheeler / Bicycle Commute to Office",
    time: "08:30 AM",
    duration: 35,
    env: "transit",
    intensity: "moderate",
    cohort: "general",
    mask: true,
  },
  {
    label: "🛍️ Evening Street Market",
    name: "Outdoor Vegetable & Street Market Shopping",
    time: "07:00 PM",
    duration: 45,
    env: "outdoor",
    intensity: "light",
    cohort: "general",
    mask: true,
  },
  {
    label: "🧘 Indoor Yoga (HEPA)",
    name: "Morning Yoga & Pranayama in Living Room",
    time: "06:30 AM",
    duration: 40,
    env: "indoor_hepa",
    intensity: "light",
    cohort: "asthma",
    mask: false,
  },
];

interface ActivitySafetyVerifierProps {
  planInput: UserPlanInput;
  setPlanInput: React.Dispatch<React.SetStateAction<UserPlanInput>>;
  isVerifying: boolean;
  verificationResult: PlanVerificationResult | null;
  verificationError: string | null;
  addedSuccess: string | null;
  lang: "en" | "hi";
  onApplyPreset: (preset: PresetPlan) => void;
  onVerifyPlan: () => void;
  onAddVerifiedPlanToRoutine: () => void;
}

/**
 * AI Activity Safety Verifier component that accepts custom user schedule entries
 * and evaluates respiratory risk using Gemini and diurnal boundary layer physics.
 */
export function ActivitySafetyVerifier({
  planInput,
  setPlanInput,
  isVerifying,
  verificationResult,
  verificationError,
  addedSuccess,
  lang,
  onApplyPreset,
  onVerifyPlan,
  onAddVerifiedPlanToRoutine,
}: ActivitySafetyVerifierProps) {
  return (
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

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#8496A8] uppercase tracking-wider">
          {lang === "hi" ? "त्वरित परिदृश्य चुनें:" : "Quick Demo Scenarios:"}
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_PLANS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="px-2.5 py-1 text-xs rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(77,184,255,0.15)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(77,184,255,0.3)] text-[#D5E2EE] transition-all cursor-pointer font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input Form */}
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

      {/* Second Row: Intensity, Cohort, Mask, & Submit */}
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
            onClick={onVerifyPlan}
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

      {/* Verification Result Card */}
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
                    {verificationResult.protectiveMeasures.map((measure: string, mIdx: number) => (
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
                  onClick={onAddVerifiedPlanToRoutine}
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
  );
}
