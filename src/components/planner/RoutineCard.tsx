"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { RoutineActivity } from "@/lib/intelligence/routine-generator";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Info,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RoutineCardProps {
  act: RoutineActivity;
  isExpanded: boolean;
  lang: "en" | "hi";
  onToggleCompleted: (id: string) => void;
  onToggleExplanation: (id: string) => void;
  onDeleteCustom?: (id: string) => void;
}

/**
 * Interactive card displaying a diurnal routine recommendation, clinical rationale, and action status.
 */
export function RoutineCard({
  act,
  isExpanded,
  lang,
  onToggleCompleted,
  onToggleExplanation,
  onDeleteCustom,
}: RoutineCardProps) {
  const isDone = Boolean(act.completed);

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
          onClick={() => onToggleCompleted(act.id)}
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

              {act.isCustom && onDeleteCustom && (
                <button
                  onClick={() => onDeleteCustom(act.id)}
                  className="p-1 rounded-lg text-[#8496A8] hover:text-[#F87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
                  title="Remove custom plan"
                  aria-label="Remove custom plan"
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
              onClick={() => onToggleExplanation(act.id)}
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
