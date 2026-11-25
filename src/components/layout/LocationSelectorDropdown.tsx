"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  RefreshCw,
  ChevronDown,
  Search,
  Crosshair,
  X,
  Compass,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CityLocation } from "@/types/air-quality";
import { cn } from "@/lib/utils";

type LocationTab = "presets" | "search" | "coords";

interface LocationSelectorDropdownProps {
  selectedCity: CityLocation;
  cities: CityLocation[];
  isLocating: boolean;
  onSelectCity: (city: CityLocation) => void;
  onRequestLocation: () => Promise<boolean>;
  onSetCustomCoordinates: (lat: number, lon: number, name?: string) => void;
}

/**
 * Header location picker supporting curated hubs, GPS geolocation, global city
 * geocoding search, and manual coordinate entry.
 */
export function LocationSelectorDropdown({
  selectedCity,
  cities,
  isLocating,
  onSelectCity,
  onRequestLocation,
  onSetCustomCoordinates,
}: LocationSelectorDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LocationTab>("presets");
  const [cityFilter, setCityFilter] = useState("");
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<CityLocation[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [locNameInput, setLocNameInput] = useState("");
  const [coordError, setCoordError] = useState("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const filteredPresets = cities.filter((c) => {
    const query = cityFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query) ||
      c.region.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (geoQuery.trim().length < 2) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(geoQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setGeoResults(Array.isArray(data) ? data : data.results || []);
        }
      } catch (_err) {
        setGeoResults([]);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [geoQuery]);

  const handleGeoQueryChange = (val: string) => {
    setGeoQuery(val);
    if (val.trim().length < 2) {
      setGeoResults([]);
      setIsSearchingGeo(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const success = await onRequestLocation();
    if (success) setDropdownOpen(false);
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordError("");
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError("Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setCoordError("Longitude must be a valid number between -180 and 180.");
      return;
    }

    onSetCustomCoordinates(lat, lon, locNameInput.trim() || undefined);
    setDropdownOpen(false);
    setLatInput("");
    setLonInput("");
    setLocNameInput("");
  };

  const tabClass = (tab: LocationTab) =>
    cn(
      "py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
      activeTab === tab
        ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] shadow-xs"
        : "text-[#8496A8] hover:text-[#F2F6FA]"
    );

  return (
    <div className="relative shrink-0">
      <button
        type="button"
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
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.06)]">
                <button type="button" onClick={() => setActiveTab("presets")} className={tabClass("presets")}>
                  Presets
                </button>
                <button type="button" onClick={() => setActiveTab("search")} className={tabClass("search")}>
                  <Globe className="w-3 h-3" />
                  <span>Search</span>
                </button>
                <button type="button" onClick={() => setActiveTab("coords")} className={tabClass("coords")}>
                  <Compass className="w-3 h-3" />
                  <span>Lat / Lon</span>
                </button>
              </div>

              {activeTab === "presets" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    aria-label="Use current GPS location"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-[rgba(77,184,255,0.12)] hover:bg-[rgba(77,184,255,0.2)] border border-[rgba(77,184,255,0.3)] text-[#4DB8FF] text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                  >
                    <Crosshair className={cn("w-3.5 h-3.5", isLocating && "animate-spin")} />
                    <span>{isLocating ? "Locating Position..." : "Use GPS Current Location"}</span>
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
                        type="button"
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
                          type="button"
                          onClick={() => {
                            onSelectCity(city);
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
                        type="button"
                        onClick={() => {
                          onSelectCity(result);
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

                  {coordError && <div className="text-xs text-[#FF5C5C]">{coordError}</div>}

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
  );
}
