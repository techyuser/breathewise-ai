"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sliders } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { HomeConfig } from "@/lib/intelligence/indoor-assessment";

interface HouseholdAssessmentDrawerProps {
  isOpen: boolean;
  homeConfig: HomeConfig;
  onSaveConfig: (newConfig: HomeConfig) => void;
}

/**
 * Collapsible Household Assessment Form for home size, air purifier ownership,
 * window draft tightness, dusting methods, cooking setup, and incense usage.
 */
export function HouseholdAssessmentDrawer({
  isOpen,
  homeConfig,
  onSaveConfig,
}: HouseholdAssessmentDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card elevated className="p-5 md:p-6 rounded-3xl border-[rgba(77,184,255,0.25)] bg-[rgba(10,22,17,0.85)] space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#4DB8FF]" />
                <h3 className="text-sm font-bold text-[#F2F6FA]">
                  Household Assessment Form
                </h3>
              </div>
              <span className="text-xs text-[#A3B3C2]">
                Personalizes indoor source mitigation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Home Size & Air Purifier */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#A3B3C2]">
                  Apartment / Home Size ({homeConfig.homeSizeSqFt} sq.ft)
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="50"
                  value={homeConfig.homeSizeSqFt ?? 650}
                  aria-label="Apartment or Home Size in square feet"
                  onChange={(e) =>
                    onSaveConfig({
                      ...homeConfig,
                      homeSizeSqFt: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#4DB8FF] cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-[#8496A8]">
                  <span>300 sq.ft (Studio)</span>
                  <span>3000 sq.ft (Bungalow)</span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#F2F6FA]">HEPA Air Purifier</span>
                  <button
                    type="button"
                    onClick={() =>
                      onSaveConfig({
                        ...homeConfig,
                        hasAirPurifier: !homeConfig.hasAirPurifier,
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      homeConfig.hasAirPurifier
                        ? "bg-[#4DB8FF] text-[#0A1118]"
                        : "bg-[rgba(255,255,255,0.08)] text-[#A3B3C2]"
                    }`}
                  >
                    {homeConfig.hasAirPurifier ? "Active / Owned" : "None"}
                  </button>
                </div>
              </div>

              {/* 2. Window Drafts & Infiltration */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#A3B3C2]">
                  Window & Door Draft Seal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "sealed", label: "Airtight" },
                    { key: "moderate", label: "Moderate" },
                    { key: "leaky", label: "Drafty" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        onSaveConfig({
                          ...homeConfig,
                          windowDrafts: opt.key as HomeConfig["windowDrafts"],
                        })
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer border ${
                        homeConfig.windowDrafts === opt.key
                          ? "bg-[rgba(77,184,255,0.18)] border-[#4DB8FF] text-[#4DB8FF] font-semibold shadow-[0_0_12px_rgba(77,184,255,0.2)]"
                          : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(24,38,56,0.85)] hover:border-[rgba(77,184,255,0.4)] hover:shadow-[0_4px_16px_rgba(77,184,255,0.15)] hover:-translate-y-0.5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#A3B3C2] block mb-1.5">
                    Daily Floor Dusting Method
                  </label>
                  <select
                    value={homeConfig.dustingMethod ?? "wet_mop"}
                    onChange={(e) =>
                      onSaveConfig({
                        ...homeConfig,
                        dustingMethod: e.target.value as HomeConfig["dustingMethod"],
                      })
                    }
                    className="w-full bg-[rgba(18,29,42,0.9)] hover:bg-[rgba(24,38,56,0.95)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(77,184,255,0.4)] hover:shadow-[0_4px_20px_rgba(77,184,255,0.15)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF] transition-all duration-200 cursor-pointer"
                  >
                    <option value="wet_mop">Wet Microfiber Mopping (Optimal)</option>
                    <option value="dry_broom">Dry Broom Sweeping (High Resuspension)</option>
                    <option value="hepa_vacuum">HEPA-Sealed Vacuum</option>
                  </select>
                </div>
              </div>

              {/* 3. Cooking Fuel & Incense */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#A3B3C2] block mb-1.5">
                  Kitchen Cooking Setup
                </label>
                <select
                  value={homeConfig.cookingType ?? "lpg_exhaust"}
                  onChange={(e) =>
                    onSaveConfig({
                      ...homeConfig,
                      cookingType: e.target.value as HomeConfig["cookingType"],
                    })
                  }
                  className="w-full bg-[rgba(18,29,42,0.9)] hover:bg-[rgba(24,38,56,0.95)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(77,184,255,0.4)] hover:shadow-[0_4px_20px_rgba(77,184,255,0.15)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF] transition-all duration-200 cursor-pointer"
                >
                  <option value="lpg_exhaust">LPG / Piped Gas with Exhaust Chimney</option>
                  <option value="lpg_no_exhaust">LPG / Gas without Exhaust Hood</option>
                  <option value="electric">Electric Induction / Ceramic Stove</option>
                  <option value="chulha">Traditional Biomass / Chulha (High Risk)</option>
                </select>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#A3B3C2] block mb-1.5">
                    Agarbatti / Incense / Dhoop
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "never", label: "Never" },
                      { key: "occasional", label: "Weekly" },
                      { key: "daily", label: "Daily" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          onSaveConfig({
                            ...homeConfig,
                            incenseUsage: opt.key as HomeConfig["incenseUsage"],
                          })
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer border ${
                          homeConfig.incenseUsage === opt.key
                            ? "bg-[rgba(77,184,255,0.18)] border-[#4DB8FF] text-[#4DB8FF] font-semibold shadow-[0_0_12px_rgba(77,184,255,0.2)]"
                            : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(24,38,56,0.85)] hover:border-[rgba(77,184,255,0.4)] hover:shadow-[0_4px_16px_rgba(77,184,255,0.15)] hover:-translate-y-0.5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
