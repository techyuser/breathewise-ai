"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AirQualityData, AqiStandard, CityLocation } from "@/types/air-quality";
import { PRESET_CITIES } from "@/lib/constants/cities";
import {
  readStorageJson,
  readStorageString,
  writeStorageJson,
  writeStorageString,
} from "@/lib/storage";
import { logger } from "@/lib/logger";

interface AirQualityContextType {
  selectedCity: CityLocation;
  setSelectedCity: (city: CityLocation) => void;
  cities: CityLocation[];
  airData: AirQualityData | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  activeStandard: AqiStandard;
  setAqiStandard: (standard: AqiStandard) => void;
  refreshData: () => Promise<void>;
  setCustomCoordinates: (lat: number, lon: number, name?: string) => void;
  requestLocationPermission: () => Promise<boolean>;
  isLocating: boolean;
  locationError: string | null;
}

const AirQualityContext = createContext<AirQualityContextType | undefined>(undefined);
const AIR_DATA_STORAGE_KEY = "breathewise_last_air_data";
const SELECTED_CITY_KEY = "breathewise_selected_city";
const SAVED_LOCATION_KEY = "breathewise_saved_location";

function subscribeNetwork(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getNetworkSnapshot() {
  return !window.navigator.onLine;
}

function getNetworkServerSnapshot() {
  return false;
}

function loadInitialCity(): CityLocation {
  const fromCityKey = readStorageJson<CityLocation | null>(SELECTED_CITY_KEY, null);
  if (fromCityKey) return fromCityKey;
  const fromSavedKey = readStorageJson<CityLocation | null>(SAVED_LOCATION_KEY, null);
  return fromSavedKey || PRESET_CITIES[0];
}

/**
 * Global client provider synchronizing city telemetry, AQI standards, offline snapshots,
 * and automatic browser geolocation with IP fallback.
 */
export function AirQualityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<CityLocation>(loadInitialCity);
  const [airData, setAirData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStandard, setActiveStandard] = useState<AqiStandard>("INDIA_CPCB");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isOffline = React.useSyncExternalStore(
    subscribeNetwork,
    getNetworkSnapshot,
    getNetworkServerSnapshot
  );

  const setSelectedCity = useCallback((city: CityLocation) => {
    setSelectedCityState(city);
    writeStorageJson(SELECTED_CITY_KEY, city);
    writeStorageJson(SAVED_LOCATION_KEY, city);
  }, []);

  const restoreOfflineSnapshot = useCallback((offlineNotice: string): boolean => {
    const cached = readStorageJson<AirQualityData | null>(AIR_DATA_STORAGE_KEY, null);
    if (cached) {
      setAirData(cached);
      setError(null);
      return true;
    }
    setError(offlineNotice);
    return false;
  }, []);

  const fetchAtmosphericData = useCallback(
    async (city: CityLocation, standard: AqiStandard, forceRefresh = false) => {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        restoreOfflineSnapshot(
          "You are currently offline and no local atmospheric cache is present."
        );
        setLoading(false);
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          city: city.id,
          lat: city.lat.toString(),
          lon: city.lon.toString(),
          name: city.name,
          standard,
          ...(forceRefresh ? { refresh: "true" } : {}),
        });

        const res = await fetch(`/api/air-quality?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

        const data: AirQualityData = await res.json();
        setAirData(data);
        setError(null);
        writeStorageJson(AIR_DATA_STORAGE_KEY, data);
      } catch (err) {
        logger.warn("AirQualityContext", err);
        restoreOfflineSnapshot(
          "Unable to sync live atmospheric data from Open-Meteo. Please check your network connection or try refreshing."
        );
      } finally {
        setLoading(false);
      }
    },
    [restoreOfflineSnapshot]
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    setIsLocating(true);
    setLocationError(null);

    const applyLocation = (loc: CityLocation) => {
      setSelectedCity(loc);
      setIsLocating(false);
      setLocationError(null);
      writeStorageString("breathewise_use_gps", "true");
    };

    const tryIpFallback = async (): Promise<boolean> => {
      try {
        const ipRes = await fetch("/api/geocoding?ip=true");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.success && ipData.location) {
            applyLocation(ipData.location);
            return true;
          }
        }
      } catch (err) {
        logger.warn("IpGeolocation", err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ipOk = await tryIpFallback();
      if (!ipOk) {
        setIsLocating(false);
        setLocationError(
          "Location detection is not supported. Please select your city from the location menu."
        );
      }
      return ipOk;
    }

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const fallbackToIp = async (errNotice?: string) => {
        if (resolved) return;
        resolved = true;
        const ipSuccess = await tryIpFallback();
        if (ipSuccess) {
          resolve(true);
          return;
        }
        setIsLocating(false);
        setLocationError(
          errNotice ||
            "Unable to retrieve coordinates. Please search for your city in the location menu."
        );
        resolve(false);
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (resolved) return;
          resolved = true;
          const lat = Number(position.coords.latitude.toFixed(4));
          const lon = Number(position.coords.longitude.toFixed(4));

          try {
            const revRes = await fetch(`/api/geocoding?lat=${lat}&lon=${lon}`);
            if (revRes.ok) {
              const revData = await revRes.json();
              if (revData.success && revData.location) {
                applyLocation(revData.location);
                resolve(true);
                return;
              }
            }
          } catch (_err) {
            // Fall through to coordinate-based label when reverse geocode is unavailable
          }

          applyLocation({
            id: `gps-${lat}-${lon}`,
            name: `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
            region: "Detected Location",
            country: "",
            lat,
            lon,
            isCustomGps: true,
          });
          resolve(true);
        },
        async (err) => {
          const notice =
            err.code === err.PERMISSION_DENIED
              ? "Browser location permission denied. Switched to network location."
              : "GPS signal timed out. Switched to network location.";
          await fallbackToIp(notice);
        },
        { timeout: 7000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    });
  }, [setSelectedCity]);

  const hasAutoRequestedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasAutoRequestedRef.current) return;
    const isLanding = window.location.pathname === "/" || window.location.pathname === "/overview";
    if (!isLanding) return;

    const autoPrompted = readStorageString("breathewise_auto_location_prompted", "session");
    if (!autoPrompted) {
      hasAutoRequestedRef.current = true;
      writeStorageString("breathewise_auto_location_prompted", "true", "session");
      const timer = setTimeout(() => {
        requestLocationPermission();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [requestLocationPermission]);

  useEffect(() => {
    let isCurrent = true;
    const run = async () => {
      if (isCurrent) {
        await fetchAtmosphericData(selectedCity, activeStandard, false);
      }
    };
    run();
    return () => {
      isCurrent = false;
    };
  }, [selectedCity, activeStandard, fetchAtmosphericData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchAtmosphericData(selectedCity, activeStandard, true);
  }, [fetchAtmosphericData, selectedCity, activeStandard]);

  const setCustomCoordinates = useCallback(
    (lat: number, lon: number, name?: string) => {
      setSelectedCity({
        id: `custom-coords-${lat.toFixed(2)}-${lon.toFixed(2)}`,
        name: name || `Coords (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        region: "Custom Coordinates",
        country: "Manual Coordinates",
        lat,
        lon,
        isCustomCoordinates: true,
      });
    },
    [setSelectedCity]
  );

  const handleSetAqiStandard = useCallback((std: AqiStandard) => {
    setActiveStandard(std);
  }, []);

  return (
    <AirQualityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        cities: PRESET_CITIES,
        airData,
        loading,
        error,
        isOffline,
        activeStandard,
        setAqiStandard: handleSetAqiStandard,
        refreshData,
        setCustomCoordinates,
        requestLocationPermission,
        isLocating,
        locationError,
      }}
    >
      {children}
    </AirQualityContext.Provider>
  );
}

/**
 * Accessor hook for global air quality state and actions.
 */
export function useAirQuality() {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error("useAirQuality must be used within an AirQualityProvider");
  }
  return context;
}
