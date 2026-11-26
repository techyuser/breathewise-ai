"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { FamilyProfileInput } from "@/lib/intelligence/routine-generator";

interface FamilyProfileDrawerProps {
  isOpen: boolean;
  profile: FamilyProfileInput;
  lang: "en" | "hi";
  onProfileChange: (updated: FamilyProfileInput) => void;
}

/**
 * Collapsible configuration drawer for household health cohort,
 * commute transport modes, departure schedules, and protective equipment.
 */
export function FamilyProfileDrawer({
  isOpen,
  profile,
  lang,
  onProfileChange,
}: FamilyProfileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
                  {lang === "hi"
                    ? "पारिवारिक प्रोफ़ाइल व आवागमन सेटिंग"
                    : "Family Profile & Commute Configuration"}
                </h3>
              </div>
              <span className="text-xs text-[#4DB8FF] font-semibold">
                Personalized Algorithm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Cohort Selector */}
              <div className="space-y-1.5">
                <label htmlFor="household-cohort-select" className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                  Primary Household Cohort
                </label>
                <select
                  id="household-cohort-select"
                  value={profile.cohort}
                  onChange={(e) => {
                    const updated = {
                      ...profile,
                      cohort: e.target.value as FamilyProfileInput["cohort"],
                      hasKids: e.target.value === "family" || e.target.value === "infant",
                      hasRespiratory: e.target.value === "asthma",
                      hasElderly: e.target.value === "elderly",
                    };
                    onProfileChange(updated);
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
                <label htmlFor="commute-mode-select" className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                  Commute Transportation Mode
                </label>
                <select
                  id="commute-mode-select"
                  value={profile.commuteMode}
                  onChange={(e) => {
                    const updated = {
                      ...profile,
                      commuteMode: e.target.value as FamilyProfileInput["commuteMode"],
                    };
                    onProfileChange(updated);
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
                  <label htmlFor="morning-departure-time" className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                    Morning Leave
                  </label>
                  <input
                    id="morning-departure-time"
                    type="text"
                    value={profile.morningDeparture || "08:00 AM"}
                    aria-label="Morning departure time"
                    onChange={(e) => {
                      const updated = { ...profile, morningDeparture: e.target.value };
                      onProfileChange(updated);
                    }}
                    className="w-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="evening-return-time" className="text-xs font-bold text-[#8496A8] uppercase tracking-wider">
                    Evening Return
                  </label>
                  <input
                    id="evening-return-time"
                    type="text"
                    value={profile.eveningReturn || "06:30 PM"}
                    aria-label="Evening return time"
                    onChange={(e) => {
                      const updated = { ...profile, eveningReturn: e.target.value };
                      onProfileChange(updated);
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
                    onProfileChange(updated);
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
                    onProfileChange(updated);
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
                    onProfileChange(updated);
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
                    onProfileChange(updated);
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
  );
}
