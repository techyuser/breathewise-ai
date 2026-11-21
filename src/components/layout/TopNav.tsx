"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  Sparkles,
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
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

type LocationTab = "presets" | "search" | "coords";

export function TopNav() {
  const pathname = usePathname();
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
  } = useAirQuality();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LocationTab>("presets");
  const [cityFilter, setCityFilter] = useState("");
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<CityLocation[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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

  // Live Geocoding Search
  useEffect(() => {
    if (!geoQuery || geoQuery.trim().length < 2) {
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(geoQuery.trim())}`);
        if (res.ok) {
          const list: CityLocation[] = await res.json();
          setGeoResults(list);
        }
      } catch (err) {
        console.error("Geocoding fetch failed:", err);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 320);

    searchDebounceRef.current = timer;

    return () => {
      clearTimeout(timer);
    };
  }, [geoQuery]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customLoc: CityLocation = {
          id: "custom-gps",
          name: "Current GPS Location",
          region: "Local Coordinate",
          country: "GPS Telemetry",
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
          isCustomGps: true,
        };
        setSelectedCity(customLoc);
        setIsLocating(false);
        setDropdownOpen(false);
      },
      (err) => {
        console.warn("Geolocation lookup failed:", err);
        alert("Unable to acquire GPS coordinates. Please select manually or enter coordinates.");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
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

  const quickPills = [
    { label: "Dashboard", href: "/" },
    { label: "Air Quality", href: "/air-quality" },
    { label: "AI Planner", href: "/planner" },
    { label: "Indoor Air", href: "/indoor" },
  ];

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-[rgba(255,255,255,0.09)] bg-[rgba(8,18,14,0.85)] sm:bg-[rgba(8,18,14,0.52)] sm:backdrop-blur-3xl sticky top-0 z-30 px-3.5 sm:px-4 md:px-6 flex items-center justify-between smooth-144hz shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
        {/* Left: Brand Wordmark (Clean & Uncrowded) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#F5F8F6] group-hover:text-[#00D69A] transition-colors">
                BreatheWise
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[rgba(0,214,154,0.15)] text-[#00D69A] border border-[rgba(0,214,154,0.3)] shadow-[0_0_10px_rgba(0,214,154,0.25)]">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Center: VisionOS Navigation Capsule Pills */}
        <div className="hidden xl:flex items-center gap-1.5 p-1 rounded-full bg-[rgba(6,14,11,0.5)] border border-[rgba(255,255,255,0.06)] backdrop-blur-2xl">
          {quickPills.map((pill) => {
            const isActive =
              pill.href === "/"
                ? pathname === "/"
                : pathname.startsWith(pill.href);

            return (
              <Link
                key={pill.href}
                href={pill.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer relative",
                  isActive
                    ? "text-[#07100D] font-semibold"
                    : "text-[#98A9A1] hover:text-[#F5F8F6]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="topNavPillHighlight"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    className="absolute inset-0 bg-[#00D69A] rounded-full shadow-[0_0_12px_rgba(0,214,154,0.3)] pointer-events-none"
                  />
                )}
                <span className="relative z-10">{pill.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: City Location Dropdown + AQI Standard Switcher + Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* City / Location Dropdown Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[rgba(12,24,19,0.7)] hover:bg-[rgba(16,32,25,0.9)] border border-[rgba(255,255,255,0.1)] text-xs font-medium text-[#F5F8F6] transition-all cursor-pointer shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-[#00D69A] shrink-0" />
              <span className="font-semibold truncate max-w-[85px] sm:max-w-[130px] md:max-w-[180px]">
                {selectedCity.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#98A9A1] shrink-0" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-96 max-w-sm rounded-3xl bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.12)] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 p-3 backdrop-blur-2xl space-y-3"
                  >
{/* Navigation Tabs inside Modal */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.06)]">
                      <button
                        onClick={() => setActiveTab("presets")}
                        className={cn(
                          "py-1.5 text-[11px] font-semibold rounded-xl transition-all cursor-pointer",
                          activeTab === "presets"
                            ? "bg-[rgba(0,214,154,0.18)] text-[#00D69A] border border-[rgba(0,214,154,0.3)] shadow-sm"
                            : "text-[#98A9A1] hover:text-[#F5F8F6]"
                        )}
                      >
                        Hotspots
                      </button>
                      <button
                        onClick={() => setActiveTab("search")}
                        className={cn(
                          "py-1.5 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1",
                          activeTab === "search"
                            ? "bg-[rgba(0,214,154,0.18)] text-[#00D69A] border border-[rgba(0,214,154,0.3)] shadow-sm"
                            : "text-[#98A9A1] hover:text-[#F5F8F6]"
                        )}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Search</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("coords")}
                        className={cn(
                          "py-1.5 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1",
                          activeTab === "coords"
                            ? "bg-[rgba(0,214,154,0.18)] text-[#00D69A] border border-[rgba(0,214,154,0.3)] shadow-sm"
                            : "text-[#98A9A1] hover:text-[#F5F8F6]"
                        )}
                      >
                        <Compass className="w-3 h-3" />
                        <span>Lat / Lon</span>
                      </button>
                    </div>

                    {/* Quick GPS button */}
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold bg-[rgba(0,214,154,0.1)] text-[#00D69A] border border-[rgba(0,214,154,0.22)] hover:bg-[rgba(0,214,154,0.18)] transition-colors cursor-pointer"
                    >
                      <Crosshair
                        className={cn("w-3.5 h-3.5", isLocating && "animate-spin")}
                      />
                      <span>
                        {isLocating
                          ? "Triangulating GPS..."
                          : "Use Local GPS Coordinates"}
                      </span>
                    </button>

                    {/* TAB 1: PRESETS */}
                    {activeTab === "presets" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#64786E] absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            placeholder="Filter smog metro..."
                            className="w-full bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F8F6] placeholder:text-[#64786E] focus:outline-none focus:border-[#00D69A]"
                            autoFocus
                          />
                          {cityFilter && (
                            <button
                              onClick={() => setCityFilter("")}
                              className="absolute right-2.5 top-2.5 text-[#64786E] hover:text-[#F5F8F6]"
                            >
                              <X className="w-3 h-3" />
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
                                  setCityFilter("");
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-[rgba(0,214,154,0.12)] text-[#00D69A] font-semibold border border-[rgba(0,214,154,0.25)]"
                                    : "text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.04)]"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-[#F5F8F6] flex items-center gap-1.5">
                                    {city.name}
                                    {city.isIndianCity && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[rgba(0,214,154,0.12)] text-[#00D69A]">
                                        CPCB
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-[#64786E]">
                                    {city.region}, {city.country}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#64786E]">
                                  {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: WORLDWIDE SEARCH */}
                    {activeTab === "search" && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#64786E] absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={geoQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGeoQuery(val);
                              if (val.trim().length < 2) {
                                setGeoResults([]);
                                setIsSearchingGeo(false);
                              }
                            }}
                            placeholder="Search any global town or city..."
                            className="w-full bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F8F6] placeholder:text-[#64786E] focus:outline-none focus:border-[#00D69A]"
                            autoFocus
                          />
                          {isSearchingGeo && (
                            <RefreshCw className="w-3 h-3 text-[#00D69A] animate-spin absolute right-3 top-2.5" />
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {geoResults.length === 0 ? (
                            <div className="text-center py-6 text-xs text-[#64786E]">
                              {geoQuery.length < 2
                                ? "Type at least 2 characters to search Open-Meteo geocoding database."
                                : isSearchingGeo
                                ? "Searching worldwide locations..."
                                : "No matching cities found."}
                            </div>
                          ) : (
                            geoResults.map((loc) => (
                              <button
                                key={loc.id}
                                onClick={() => {
                                  setSelectedCity(loc);
                                  setDropdownOpen(false);
                                  setGeoQuery("");
                                  setGeoResults([]);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] text-[#98A9A1] hover:text-[#F5F8F6] transition-colors cursor-pointer"
                              >
                                <div>
                                  <div className="font-semibold text-[#F5F8F6] flex items-center gap-1.5">
                                    {loc.name}
                                    {loc.isIndianCity && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[rgba(0,214,154,0.12)] text-[#00D69A]">
                                        CPCB
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#64786E]">
                                    {loc.region ? `${loc.region}, ` : ""}
                                    {loc.country}
                                  </div>
                                </div>
                                <span className="text-[10px] text-[#64786E]">
                                  {loc.lat}°, {loc.lon}°
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: CUSTOM LAT / LON COORDINATES */}
                    {activeTab === "coords" && (
                      <form onSubmit={handleApplyCoordinates} className="space-y-2.5">
                        <div className="text-[11px] text-[#98A9A1] leading-relaxed">
                          Enter exact geographical coordinates to query real-time Open-Meteo CAMS grid points:
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-[#64786E]">
                              Latitude (-90 to 90)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={latInput}
                              onChange={(e) => setLatInput(e.target.value)}
                              placeholder="e.g. 28.6139"
                              required
                              className="w-full bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F8F6] placeholder:text-[#64786E] focus:outline-none focus:border-[#00D69A]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-[#64786E]">
                              Longitude (-180 to 180)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={lonInput}
                              onChange={(e) => setLonInput(e.target.value)}
                              placeholder="e.g. 77.2090"
                              required
                              className="w-full bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F8F6] placeholder:text-[#64786E] focus:outline-none focus:border-[#00D69A]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#64786E]">
                            Location Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={locNameInput}
                            onChange={(e) => setLocNameInput(e.target.value)}
                            placeholder="e.g. Connaught Place Research Site"
                            className="w-full bg-[rgba(6,14,11,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F8F6] placeholder:text-[#64786E] focus:outline-none focus:border-[#00D69A]"
                          />
                        </div>

                        {coordError && (
                          <div className="text-[11px] text-[#F87171]">{coordError}</div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2 rounded-xl bg-[#00D69A] text-[#07100D] font-bold text-xs hover:bg-[#05E5A6] transition-colors cursor-pointer shadow-sm"
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(250,204,21,0.12)] border border-[rgba(250,204,21,0.3)] text-[#FACC15] text-[11px] font-semibold">
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Offline (Cached Snapshot)</span>
              <span className="sm:hidden">Offline</span>
            </div>
          )}

          {/* AQI Standard Switcher Capsule */}
          <div className="hidden sm:flex items-center p-0.5 rounded-full bg-[rgba(7,14,11,0.55)] border border-[rgba(255,255,255,0.08)] text-[11px]">
            <button
              onClick={() => setAqiStandard("INDIA_CPCB")}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer",
                isCpcb
                  ? "bg-[rgba(0,214,154,0.2)] text-[#00D69A] border border-[rgba(0,214,154,0.35)] shadow-sm"
                  : "text-[#98A9A1] hover:text-[#F5F8F6]"
              )}
              title="Official India National AQI (CPCB Algorithm)"
            >
              <span className="sm:hidden">NAQI</span>
              <span className="hidden sm:inline">India NAQI</span>
            </button>
            <button
              onClick={() => setAqiStandard("US_EPA")}
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer",
                !isCpcb
                  ? "bg-[rgba(56,189,248,0.2)] text-[#38BDF8] border border-[rgba(56,189,248,0.35)] shadow-sm"
                  : "text-[#98A9A1] hover:text-[#F5F8F6]"
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
                "w-4 h-4 text-[#98A9A1] hover:text-[#00D69A]",
                loading && "animate-spin text-[#00D69A]"
              )}
            />
          </Button>

          <Link href="/assistant" className="hidden sm:inline-block">
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-[#00D69A]" />}
            >
              AI Workspace
            </Button>
          </Link>

          {/* Emergency Smog Shield Indicator Pill */}
          <button
            onClick={() => setProtectionModalOpen(true)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isHighSmog
                ? "bg-[rgba(248,113,113,0.12)] border-[rgba(248,113,113,0.3)] text-[#F87171] hover:bg-[rgba(248,113,113,0.2)]"
                : "bg-[rgba(0,214,154,0.12)] border-[rgba(0,214,154,0.3)] text-[#00D69A] hover:bg-[rgba(0,214,154,0.2)]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-[#98A9A1]">
              Protection
            </span>
            <span className="font-bold">
              {isHighSmog ? "High Guard" : "Nominal"}
            </span>
          </button>
        </div>
      </header>

      {/* Refresh Toast Notification */}
      <AnimatePresence>
        {refreshToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-[rgba(10,22,17,0.95)] border border-[rgba(0,214,154,0.35)] text-[#00D69A] text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#00D69A] animate-ping" />
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
                  className="w-full max-w-md bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.16)] rounded-3xl p-6 shadow-[0_32px_100px_rgba(0,0,0,0.9),inset_0_1.5px_0_0_rgba(255,255,255,0.25)] space-y-4 backdrop-blur-3xl m-auto"
                >
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#00D69A]" />
                      <h3 className="text-base font-bold text-[#F5F8F6]">
                        Active Protection Protocol
                      </h3>
                    </div>
                    <button
                      onClick={() => setProtectionModalOpen(false)}
                      className="p-1.5 rounded-xl text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-[#98A9A1]">
                    <p>
                      Current modeled atmospheric parameters for{" "}
                      <strong className="text-[#F5F8F6]">{selectedCity.name}</strong> indicate{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          isHighSmog ? "text-[#F87171]" : "text-[#00D69A]"
                        )}
                      >
                        {isHighSmog
                          ? "elevated winter smog trap"
                          : "nominal ambient ventilation"}
                      </span>
                      .
                    </p>
                    <div className="p-3.5 rounded-2xl bg-[rgba(12,24,19,0.65)] border border-[rgba(255,255,255,0.08)] space-y-1.5">
                      <div className="font-semibold text-[#F5F8F6]">Recommended Countermeasures:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>N95 / FFP2 respirator for outdoor intervals</li>
                        <li>Indoor recirculating HEPA filtration active</li>
                        <li>Avoid morning hours (6:00 AM – 9:00 AM) near arterial roads</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setProtectionModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#00D69A] text-[#07100D] text-xs font-bold hover:bg-[#05E5A6] transition-colors shadow-sm cursor-pointer"
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
