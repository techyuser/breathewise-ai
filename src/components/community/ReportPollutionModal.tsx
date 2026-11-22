"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, MapPin, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CommunityAlertData {
  type: "Biomass Burning" | "Construction Dust" | "Severe Smog Pocket" | "Industrial Smoke" | "Traffic Gridlock";
  severity: "Moderate" | "High" | "Severe";
}

interface ReportPollutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formLocation: string;
  setFormLocation: (val: string) => void;
  formType: CommunityAlertData["type"];
  setFormType: (val: CommunityAlertData["type"]) => void;
  formSeverity: CommunityAlertData["severity"];
  setFormSeverity: (val: CommunityAlertData["severity"]) => void;
  formDesc: string;
  setFormDesc: (val: string) => void;
  formPhoto: string | null;
  setFormPhoto: (val: string | null) => void;
  onDetectGps: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitSuccess: boolean;
  isSubmitting: boolean;
}

/**
 * Modal form allowing citizens to report local environmental pollution incidents
 * directly to the peer-to-peer citizen observation mesh.
 */
export function ReportPollutionModal({
  isOpen,
  onClose,
  formLocation,
  setFormLocation,
  formType,
  setFormType,
  formSeverity,
  setFormSeverity,
  formDesc,
  setFormDesc,
  formPhoto,
  setFormPhoto,
  onDetectGps,
  onSubmit,
  submitSuccess,
  isSubmitting,
}: ReportPollutionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.16)] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FACC15]" />
                <h3 className="text-base font-bold text-[#F2F6FA]">
                  Report Environmental Pollution Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close report modal"
                className="p-1 rounded-lg text-[#A3B3C2] hover:text-[#F2F6FA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Location Input with GPS Detect Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="incident-location" className="text-xs font-semibold text-[#A3B3C2]">
                    Incident Location / Landmark
                  </label>
                  <button
                    type="button"
                    onClick={onDetectGps}
                    className="text-xs font-semibold text-[#4DB8FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    Detect GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  id="incident-location"
                  aria-label="Incident Location or Landmark"
                  placeholder="e.g. Ring Road service lane near Sector 12"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-[rgba(18,29,42,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2.5 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF]"
                />
              </div>

              {/* Category & Severity Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="pollution-category" className="text-xs font-semibold text-[#A3B3C2]">
                    Pollution Category
                  </label>
                  <select
                    id="pollution-category"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CommunityAlertData["type"])}
                    className="w-full bg-[rgba(18,29,42,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF]"
                  >
                    <option value="Biomass Burning">Biomass / Garbage Burning</option>
                    <option value="Construction Dust">Construction Dust Plume</option>
                    <option value="Severe Smog Pocket">Severe Smog Pocket</option>
                    <option value="Industrial Smoke">Industrial Stack Smoke</option>
                    <option value="Traffic Gridlock">Severe Traffic Gridlock</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="severity-level" className="text-xs font-semibold text-[#A3B3C2]">
                    Severity Level
                  </label>
                  <select
                    id="severity-level"
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as CommunityAlertData["severity"])}
                    className="w-full bg-[rgba(18,29,42,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF]"
                  >
                    <option value="Moderate">Moderate Issue</option>
                    <option value="High">High Smoke / Dust</option>
                    <option value="Severe">Severe Hazard / Stifling</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="observation-desc" className="text-xs font-semibold text-[#A3B3C2]">
                  Detailed Observation Description
                </label>
                <textarea
                  id="observation-desc"
                  required
                  rows={3}
                  placeholder="Describe source, wind direction, visible smoke density, or ongoing construction activities..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[rgba(18,29,42,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-xs text-[#F2F6FA] outline-none focus:border-[#4DB8FF]"
                />
              </div>

              {/* Simulated Photo Attachment */}
              <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#A3B3C2]">
                  <Camera className="w-4 h-4 text-[#38BDF8]" />
                  <span>{formPhoto ? "Photo Attached (1 file)" : "Attach Photo Evidence (Optional)"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormPhoto(formPhoto ? null : "photo_simulated.jpg")}
                  className="text-xs font-semibold text-[#4DB8FF] hover:underline cursor-pointer"
                >
                  {formPhoto ? "Remove" : "Simulate Upload"}
                </button>
              </div>

              {submitSuccess ? (
                <div className="p-3 rounded-xl bg-[rgba(77,184,255,0.15)] border border-[#4DB8FF] text-xs font-bold text-[#4DB8FF] text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Incident successfully logged to Citizen Mesh!</span>
                </div>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Broadcasting Observation..." : "Submit Incident Report"}
                </Button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
