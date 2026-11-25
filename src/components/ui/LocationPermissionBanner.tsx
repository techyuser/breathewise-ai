"use client";

import React, { useState } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { MapPin, Navigation, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { readStorageString, writeStorageString } from "@/lib/storage";

const DISMISS_KEY = "breathewise_location_banner_dismissed";

/**
 * Dismissible top-of-page geolocation permission prompt with toast feedback.
 */
export function LocationPermissionBanner() {
  const { selectedCity, requestLocationPermission, isLocating, locationError } =
    useAirQuality();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return (
      readStorageString(DISMISS_KEY) === "true" ||
      readStorageString("breathewise_use_gps") === "true"
    );
  });
  const [grantedToast, setGrantedToast] = useState(false);

  const handleAllowLocation = async () => {
    const success = await requestLocationPermission();
    if (success) {
      setIsDismissed(true);
      setGrantedToast(true);
      setTimeout(() => setGrantedToast(false), 3500);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    writeStorageString(DISMISS_KEY, "true");
  };

  return (
    <>
      <AnimatePresence>
        {!isDismissed && !selectedCity.isCustomGps && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[rgba(18,29,42,0.85)] border border-[rgba(77,184,255,0.25)] text-xs backdrop-blur-xl shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-[rgba(77,184,255,0.12)] border border-[rgba(77,184,255,0.3)] flex items-center justify-center shrink-0 text-[#4DB8FF]">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-[#F2F6FA]">
                    Detect your local air quality?
                  </span>
                  <span className="text-[#A3B3C2] hidden md:inline ml-1.5">
                    Allow location permission to view real-time atmospheric data for your coordinates.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleAllowLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 rounded-xl bg-[#4DB8FF] text-[#0A1118] font-bold text-xs hover:bg-[#7CCBFF] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                >
                  {isLocating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Locating...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>Use My Location</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1.5 rounded-xl text-[#8496A8] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                  aria-label="Dismiss location prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {grantedToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed top-20 right-6 z-50 bg-[rgba(18,29,42,0.96)] border border-[rgba(77,184,255,0.35)] text-[#4DB8FF] text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#4DB8FF] animate-ping" />
            <span>Location set to {selectedCity.name}. Showing local air quality.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed top-20 right-6 z-50 bg-[rgba(24,18,20,0.96)] border border-[rgba(255,92,92,0.35)] text-[#FF5C5C] text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center gap-2 max-w-md"
          >
            <span>{locationError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
