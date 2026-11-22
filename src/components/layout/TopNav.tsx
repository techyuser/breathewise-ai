"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  Search,
  Crosshair,
  X,
  Compass,
  WifiOff,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAirQuality } from "@/context/AirQualityContext";
import { CityLocation } from "@/types/air-quality";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

type LocationTab = "presets" | "search" | "coords";

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LocationTab>("presets");
  const [cityFilter, setCityFilter] = useState("");
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<CityLocation[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);
  const [protectionModalOpen, setProtectionModalOpen] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  // Custom coordinates inputs
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [locNameInput, setLocNameInput] = useState("");
  const [coordError, setCoordError] = useState("");

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Filter preset cities
  const filteredPresets = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(cityFilter.toLowerCase()) ||
      c.country.toLowerCase().includes(cityFilter.toLowerCase()) ||
      c.region.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const handleGeoQueryChange = (val: string) => {
    setGeoQuery(val);
    if (val.trim().length < 2) {
      setGeoResults([]);
      setIsSearchingGeo(false);
    }
  };

  // Live Geocoding Search
  useEffect(() => {
    if (geoQuery.trim().length < 2) {
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(geoQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setGeoResults(Array.isArray(data) ? data : (data.results || []));
        }
      } catch {
        setGeoResults([]);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [geoQuery]);

  const handleUseCurrentLocation = async () => {
    const success = await requestLocationPermission();
    if (success) {
      setDropdownOpen(false);
    }
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordError("");

    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError("Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setCoordError("Longitude must be a valid number between -180 and 180.");
      return;
    }

    setCustomCoordinates(
      lat,
      lon,
      locNameInput.trim() ? locNameInput.trim() : undefined
    );
    setDropdownOpen(false);
    setLatInput("");
    setLonInput("");
    setLocNameInput("");
  };

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
        {/* Left: Mobile Brand Wordmark (hidden on desktop where permanent sidebar is shown) */}
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

        {/* Right: Location Selector + AQI Switcher + Refresh + Emergency Shield */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* City / Location Dropdown Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="dialog"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[rgba(18,29,42,0.7)] hover:bg-[rgba(24,38,56,0.9)] border border-[rgba(255,255,255,0.1)] text-xs font-medium text-[#F2F6FA] transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
              aria-label={`Current location: ${selectedCity.name}. Click to change.`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#4DB8FF] shrink-0" />
              <span className="font-semibold truncate max-w-[85px] sm:max-w-[130px] md:max-w-[180px]">
                {selectedCity.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#A3B3C2] shrink-0" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-96 max-w-sm rounded-3xl bg-[rgba(18,29,42,0.98)] border border-[rgba(255,255,255,0.14)] shadow-[0_24px_64px_rgba(0,0,0,0.85)] z-50 p-3.5 backdrop-blur-3xl space-y-3"
                  >
                    {/* Navigation Tabs inside Modal */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)]">
                      <button
                        onClick={() => setActiveTab("presets")}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                          activeTab === "presets"
                            ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] shadow-xs"
                            : "text-[#8496A8] hover:text-[#F2F6FA]"
                        )}
                      >
                        Presets
                      </button>
                      <button
                        onClick={() => setActiveTab("search")}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                          activeTab === "search"
                            ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] shadow-xs"
                            : "text-[#8496A8] hover:text-[#F2F6FA]"
                        )}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Search</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("coords")}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                          activeTab === "coords"
                            ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] shadow-xs"
                            : "text-[#8496A8] hover:text-[#F2F6FA]"
                        )}
                      >
                        <Compass className="w-3 h-3" />
                        <span>Lat / Lon</span>
                      </button>
                    </div>

                    {/* TAB 1: Preset Monitored Cities */}
                    {activeTab === "presets" && (
                      <div className="space-y-2">
                        {/* Instant GPS Detection CTA */}
                        <button
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          aria-label="Use current GPS location"
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-[rgba(77,184,255,0.12)] hover:bg-[rgba(77,184,255,0.2)] border border-[rgba(77,184,255,0.3)] text-[#4DB8FF] text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                        >
                          <Crosshair
                            className={cn(
                              "w-3.5 h-3.5",
                              isLocating && "animate-spin"
                            )}
                          />
                          <span>
                            {isLocating
                              ? "Locating Position..."
                              : "Use GPS Current Location"}
                          </span>
                        </button>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#8496A8] absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter preset hubs..."
                            aria-label="Filter preset hubs"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none focus:border-[#4DB8FF]"
                          />
                          {cityFilter && (
                            <button
                              onClick={() => setCityFilter("")}
                              className="absolute right-2.5 top-2 text-[#8496A8] hover:text-[#F2F6FA]"
                              aria-label="Clear filter"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {filteredPresets.map((city) => {
                            const isSelected = selectedCity.id === city.id;
                            return (
                              <button
                                key={city.id}
                                onClick={() => {
                                  setSelectedCity(city);
                                  setDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                                  isSelected
                                    ? "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] font-semibold border border-[rgba(77,184,255,0.25)]"
                                    : "text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.04)]"
                                )}
                              >
                                <div>
                                  <span className="font-medium text-[#F2F6FA] flex items-center gap-1.5">
                                    {city.name}
                                    {city.isIndianCity && (
                                      <span className="text-xs px-1.5 py-0.2 rounded bg-[rgba(77,184,255,0.12)] text-[#4DB8FF]">
                                        CPCB Hub
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-[#8496A8]">
                                    {city.region}, {city.country}
                                  </span>
                                </div>
                                <span className="text-xs text-[#8496A8]">
                                  {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Live Geocoding Search */}
                    {activeTab === "search" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#8496A8] absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Type any city or town globally..."
                            aria-label="Search global location by city name"
                            value={geoQuery}
                            onChange={(e) => handleGeoQueryChange(e.target.value)}
                            autoFocus
                            className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none focus:border-[#4DB8FF]"
                          />
                          {isSearchingGeo && (
                            <RefreshCw className="w-3 h-3 text-[#4DB8FF] animate-spin absolute right-3 top-2.5" />
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {geoResults.length === 0 && !isSearchingGeo && (
                            <div className="text-center py-6 text-xs text-[#8496A8]">
                              {geoQuery.length >= 2
                                ? "No location found matching query."
                                : "Type at least 2 characters to search Open-Meteo Geocoding."}
                            </div>
                          )}
                          {geoResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                setSelectedCity(result);
                                setDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] text-[#A3B3C2] hover:text-[#F2F6FA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                            >
                              <div>
                                <div className="font-semibold text-[#F2F6FA] flex items-center gap-1.5">
                                  {result.name}
                                  {result.country && (
                                    <span className="text-xs px-1.5 py-0.2 rounded bg-[rgba(77,184,255,0.12)] text-[#4DB8FF]">
                                      {result.country}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#8496A8]">
                                  {result.region ? `${result.region}, ` : ""}
                                  {result.country}
                                </div>
                              </div>
                              <span className="text-xs text-[#8496A8]">
                                {result.lat.toFixed(2)}°, {result.lon.toFixed(2)}°
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Custom Coordinates Input */}
                    {activeTab === "coords" && (
                      <form onSubmit={handleApplyCoordinates} className="space-y-2.5">
                        <div className="text-xs text-[#A3B3C2] leading-relaxed">
                          Enter exact coordinates (e.g. Anand Vihar, Okhla industrial belt, or local monitoring stations).
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-[#8496A8]">
                              Latitude (-90 to 90)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={latInput}
                              onChange={(e) => setLatInput(e.target.value)}
                              placeholder="e.g. 28.6139"
                              aria-label="Latitude coordinate"
                              required
                              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none focus:border-[#4DB8FF]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-[#8496A8]">
                              Longitude (-180 to 180)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={lonInput}
                              onChange={(e) => setLonInput(e.target.value)}
                              placeholder="e.g. 77.2090"
                              aria-label="Longitude coordinate"
                              required
                              className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none focus:border-[#4DB8FF]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs uppercase font-bold text-[#8496A8]">
                            Location Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={locNameInput}
                            onChange={(e) => setLocNameInput(e.target.value)}
                            placeholder="e.g. Connaught Place Research Site"
                            aria-label="Custom location label"
                            className="w-full bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none focus:border-[#4DB8FF]"
                          />
                        </div>

                        {coordError && (
                          <div className="text-xs text-[#FF5C5C]">{coordError}</div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2 rounded-xl bg-[#4DB8FF] text-[#0A1118] font-bold text-xs hover:bg-[#7CCBFF] transition-colors cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                        >
                          Load Atmospheric Telemetry
                        </button>
                      </form>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Offline Status Badge */}
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

          {/* Refresh Button */}
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

          {/* Emergency Smog Shield Indicator Pill */}
          <button
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
            <span className="font-bold">
              {isHighSmog ? "High Guard" : "Nominal"}
            </span>
          </button>
        </div>
      </header>

      {/* Sync Toast Feedback on Refresh */}
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

      {/* Emergency Smog Shield Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {protectionModalOpen && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                onClick={() => setProtectionModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{
                    duration: 0.24,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-[rgba(18,29,42,0.98)] border border-[rgba(255,255,255,0.16)] rounded-3xl p-6 shadow-[0_32px_100px_rgba(0,0,0,0.9),inset_0_1.5px_0_0_rgba(255,255,255,0.25)] space-y-4 backdrop-blur-3xl m-auto"
                >
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#4DB8FF]" />
                      <h3 className="text-base font-bold text-[#F2F6FA]">
                        Active Protection Protocol
                      </h3>
                    </div>
                    <button
                      onClick={() => setProtectionModalOpen(false)}
                      className="p-1.5 rounded-xl text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-[#A3B3C2]">
                    <p>
                      Current modeled atmospheric parameters for{" "}
                      <strong className="text-[#F2F6FA]">{selectedCity.name}</strong> indicate{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          isHighSmog ? "text-[#FF5C5C]" : "text-[#3DDC84]"
                        )}
                      >
                        {isHighSmog
                          ? "elevated winter smog trap"
                          : "nominal ambient ventilation"}
                      </span>
                      .
                    </p>
                    <div className="p-3.5 rounded-2xl bg-[rgba(14,23,34,0.7)] border border-[rgba(255,255,255,0.08)] space-y-1.5">
                      <div className="font-semibold text-[#F2F6FA]">Recommended Countermeasures:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>N95 / FFP2 respirator for outdoor intervals</li>
                        <li>Indoor recirculating HEPA filtration active</li>
                        <li>Avoid morning hours (6:00 AM – 9:00 AM) near arterial roads</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setProtectionModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#4DB8FF] text-[#0A1118] text-xs font-bold hover:bg-[#7CCBFF] transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                  >
                    Acknowledge Protocol
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
