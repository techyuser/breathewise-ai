"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { UserPlanInput, PlanVerificationResult } from "@/lib/intelligence/plan-verifier";

interface VerificationResultCardProps {
  result: PlanVerificationResult;
  planInput: UserPlanInput;
  lang: "en" | "hi";
  onAddVerifiedPlanToRoutine: () => void;
}

function getStatusBadgeProps(status: PlanVerificationResult["status"], lang: "en" | "hi") {
  switch (status) {
    case "avoid":
      return {
        variant: "danger" as const,
        label: `🛑 ${lang === "hi" ? "उच्च जोखिम" : "HIGH RISK / AVOID"}`,
      };
    case "caution":
      return {
        variant: "warning" as const,
        label: `⚠️ ${lang === "hi" ? "सतर्कता आवश्यक" : "PROCEED WITH CAUTION"}`,
      };
    case "optimal":
      return {
        variant: "accent" as const,
        label: `✨ ${lang === "hi" ? "सर्वोत्तम समय" : "OPTIMAL WINDOW"}`,
      };
    default:
      return {
        variant: "subtle" as const,
        label: `✅ ${lang === "hi" ? "सुरक्षित" : "SAFE"}`,
      };
  }
}

/**
 * Displays the clinical and physiological dose assessment produced by the AI plan verifier,
 * including WHO benchmarks, filtration efficacy, and protective directives.
 */
export function VerificationResultCard({
  result,
  planInput,
  lang,
  onAddVerifiedPlanToRoutine,
}: VerificationResultCardProps) {
  const badgeProps = getStatusBadgeProps(result.status, lang);
  const scoreColor =
    result.safetyScore >= 80
      ? "text-[#34D399]"
      : result.safetyScore >= 55
      ? "text-[#FBBF24]"
      : "text-[#F87171]";

  const shieldingText = planInput.hasN95Mask
    ? "N95 Sealed (~85% blocked)"
    : planInput.environment === "indoor_hepa"
    ? "HEPA H13 Filtered"
    : "Zero Particle Shield";

  return (
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
          <Badge variant={badgeProps.variant} size="md" className="text-xs px-3 py-1 font-bold tracking-wide uppercase">
            {badgeProps.label}
          </Badge>

          <div>
            <h3 className="text-sm font-bold text-[#F2F6FA]">{result.verdict}</h3>
            <p className="text-xs text-[#8496A8]">
              {result.plannedTime} • {result.activityName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[11px] text-[#8496A8] block">Safety Index</span>
            <span className={cn("text-lg font-black", scoreColor)}>{result.safetyScore}/100</span>
          </div>
        </div>
      </div>

      {/* Core Summary & Clinical Explanation */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#E2E8F0] leading-relaxed">{result.summary}</p>
        <div className="p-3.5 rounded-2xl bg-[rgba(18,29,42,0.6)] border border-[rgba(255,255,255,0.06)] text-xs text-[#A3B3C2] leading-relaxed space-y-1.5">
          <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>
              {lang === "hi"
                ? "वायुमंडलीय इनवर्जन व फेफड़ों पर प्रभाव (Clinical Mechanism):"
                : "Atmospheric Inversion & Alveolar Deposition Analysis:"}
            </span>
          </div>
          <p>{result.explanation}</p>
        </div>
      </div>

      {/* Physiological Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-[rgba(14,23,34,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[11px] text-[#8496A8] uppercase tracking-wider font-semibold block">
            Estimated Inhaled PM2.5
          </span>
          <div className="text-base font-extrabold text-[#4DB8FF] flex items-baseline gap-1">
            <span>{result.estimatedInhaledDoseUg}</span>
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
            {result.whoGuidelineComparison}
          </div>
          <span className="text-[10px] text-[#64748B] block">24h WHO reference: 15 µg/m³</span>
        </div>

        <div className="p-3 rounded-2xl bg-[rgba(14,23,34,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
          <span className="text-[11px] text-[#8496A8] uppercase tracking-wider font-semibold block">
            Shielding & Filtration
          </span>
          <div className="text-xs font-bold text-[#34D399] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{shieldingText}</span>
          </div>
          <span className="text-[10px] text-[#64748B] block">
            Cohort: {result.cohort.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Recommended Adjustment */}
      {result.recommendedAdjustment && (
        <div className="p-3.5 rounded-2xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] flex items-start gap-2.5 text-xs text-[#FDE68A]">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              {lang === "hi" ? "AI अनुशंसित अनुकूलन (Optimal Alternative):" : "Recommended Adjustment & Timing:"}
            </span>
            <p className="leading-relaxed">{result.recommendedAdjustment}</p>
          </div>
        </div>
      )}

      {/* Mandatory Protective Measures */}
      {result.protectiveMeasures && result.protectiveMeasures.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-[#8496A8] uppercase tracking-wider block">
            {lang === "hi" ? "अनिवार्य सुरक्षात्मक उपाय:" : "Mandatory Protective Directives:"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.protectiveMeasures.map((measure: string, mIdx: number) => (
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

        <button
          type="button"
          onClick={onAddVerifiedPlanToRoutine}
          className="inline-flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === "hi" ? "आज की दिनचर्या में जोड़ें" : "Add to Today's Routine"}</span>
        </button>
      </div>
    </motion.div>
  );
}
