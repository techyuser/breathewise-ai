"use client";

import React, { useState } from "react";
import { RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useAirQuality } from "@/context/AirQualityContext";
import { cn } from "@/lib/utils";
import { EmergencyShieldModal } from "@/components/layout/EmergencyShieldModal";
import { LocationSelectorDropdown } from "@/components/layout/LocationSelectorDropdown";

/**
 * Primary top navigation bar housing city selection, AQI standard toggle,
 * manual telemetry refresh, offline status indicator, and emergency protocol modal.
 */
export function TopNav() {
  const {
    selectedCity,
    setSelectedCity,
    cities,
    airData,
    loading,
    isOffline,
    activeStandard,
    setAqiStandard,
    refreshData,
    setCustomCoordinates,
    requestLocationPermission,
    isLocating,
  } = useAirQuality();

  const [protectionModalOpen, setProtectionModalOpen] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleRefreshClick = async () => {
    await refreshData();
    setRefreshToast(true);
    setTimeout(() => setRefreshToast(false), 2400);
  };

  const isCpcb = activeStandard === "INDIA_CPCB";
  const currentAqi = isCpcb ? (airData?.indiaAqi ?? 0) : (airData?.usAqi ?? 0);
  const isHighSmog = isCpcb ? currentAqi > 200 : currentAqi > 150;

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(14,23,34,0.85)] sm:bg-[rgba(14,23,34,0.65)] sm:backdrop-blur-2xl sticky top-0 z-30 px-3.5 sm:px-4 md:px-6 flex items-center justify-between smooth-144hz shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
        {/* Left: Mobile Brand Wordmark */}
        <div className="flex lg:hidden items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] rounded-xl"
            aria-label="BreatheWise Home"
          >
            <span className="font-bold text-sm sm:text-base tracking-tight text-[#F2F6FA] group-hover:text-[#4DB8FF] transition-colors">
              BreatheWise
            </span>
          </Link>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block flex-1" />

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <LocationSelectorDropdown
            selectedCity={selectedCity}
            cities={cities}
            isLocating={isLocating}
            onSelectCity={setSelectedCity}
            onRequestLocation={requestLocationPermission}
            onSetCustomCoordinates={setCustomCoordinates}
          />

          {isOffline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(255,210,63,0.12)] border border-[rgba(255,210,63,0.3)] text-[#FFD23F] text-xs font-semibold">
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Offline (Cached Snapshot)</span>
              <span className="sm:hidden">Offline</span>
            </div>
          )}

          {/* AQI Standard Switcher Capsule */}
          <div className="hidden sm:flex items-center p-0.5 rounded-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] text-xs">
            <button
              type="button"
              onClick={() => setAqiStandard("INDIA_CPCB")}
              aria-pressed={isCpcb}
              aria-label="Switch to India NAQI standard"
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                isCpcb
                  ? "bg-[rgba(77,184,255,0.2)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] shadow-xs"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
              title="Official India National AQI (CPCB Algorithm)"
            >
              <span className="sm:hidden">NAQI</span>
              <span className="hidden sm:inline">India NAQI</span>
            </button>
            <button
              type="button"
              onClick={() => setAqiStandard("US_EPA")}
              aria-pressed={!isCpcb}
              aria-label="Switch to US EPA standard"
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                !isCpcb
                  ? "bg-[rgba(77,184,255,0.2)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] shadow-xs"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
              title="US EPA NowCast Algorithm"
            >
              <span className="sm:hidden">EPA</span>
              <span className="hidden sm:inline">US EPA</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshClick}
            disabled={loading}
            title="Refresh atmospheric telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 text-[#A3B3C2] hover:text-[#4DB8FF]",
                loading && "animate-spin text-[#4DB8FF]"
              )}
            />
          </Button>

          <button
            type="button"
            onClick={() => setProtectionModalOpen(true)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] ${
              isHighSmog
                ? "bg-[rgba(255,92,92,0.12)] border-[rgba(255,92,92,0.3)] text-[#FF5C5C] hover:bg-[rgba(255,92,92,0.2)]"
                : "bg-[rgba(61,220,132,0.12)] border-[rgba(61,220,132,0.3)] text-[#3DDC84] hover:bg-[rgba(61,220,132,0.2)]"
            }`}
            aria-label="Emergency Smog Shield Protection Status"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs uppercase tracking-wider text-[#A3B3C2]">
              Protection
            </span>
            <span className="font-bold">{isHighSmog ? "High Guard" : "Nominal"}</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {refreshToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[rgba(18,29,42,0.96)] border border-[rgba(77,184,255,0.35)] text-[#4DB8FF] text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#4DB8FF] animate-ping" />
            <span>Atmospheric data synchronized with CAMS model grid (~45km).</span>
          </motion.div>
        )}
      </AnimatePresence>

      <EmergencyShieldModal
        isOpen={protectionModalOpen}
        onClose={() => setProtectionModalOpen(false)}
        selectedCityName={selectedCity.name}
        isHighSmog={isHighSmog}
        mounted={mounted}
      />
    </>
  );
}
