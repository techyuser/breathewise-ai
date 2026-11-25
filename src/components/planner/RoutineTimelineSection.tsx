"use client";

import React from "react";
import { RoutineCard } from "@/components/planner/RoutineCard";
import type { RoutineActivity } from "@/lib/intelligence/routine-generator";

interface RoutineTimelineSectionProps {
  title: string;
  subtitle: string;
  emptyLabel: string;
  accentClassName: string;
  icon: React.ReactNode;
  activities: RoutineActivity[];
  expandedExplanation: Record<string, boolean>;
  lang: "en" | "hi";
  onToggleCompleted: (id: string) => void;
  onToggleExplanation: (id: string) => void;
  onDeleteCustom: (id: string) => void;
}

/**
 * Reusable diurnal time-window section rendering a period header and routine checklist cards.
 */
export function RoutineTimelineSection({
  title,
  subtitle,
  emptyLabel,
  accentClassName,
  icon,
  activities,
  expandedExplanation,
  lang,
  onToggleCompleted,
  onToggleExplanation,
  onDeleteCustom,
}: RoutineTimelineSectionProps) {
  return (
    <div className="space-y-3">
      <div
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)] pb-2 ${accentClassName}`}
      >
        {icon}
        <span>{title}</span>
        <span className="text-xs text-[#8496A8] font-normal normal-case ml-auto">
          {subtitle}
        </span>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((act) => (
            <RoutineCard
              key={act.id}
              act={act}
              isExpanded={Boolean(expandedExplanation[act.id])}
              lang={lang}
              onToggleCompleted={onToggleCompleted}
              onToggleExplanation={onToggleExplanation}
              onDeleteCustom={onDeleteCustom}
            />
          ))
        ) : (
          <p className="text-xs text-[#64748B] italic p-3">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
