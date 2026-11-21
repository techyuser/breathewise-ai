"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AirQualityData,
  AqiStandard,
  CityLocation,
} from "@/types/air-quality";
import { PRESET_CITIES } from "@/lib/open-meteo";

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
}

const AirQualityContext = createContext<AirQualityContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "breathewise_last_air_data";

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

export function AirQualityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<CityLocation>(PRESET_CITIES[0]);
  const [airData, setAirData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStandard, setActiveStandard] = useState<AqiStandard>("INDIA_CPCB");

  const isOffline = React.useSyncExternalStore(
    subscribeNetwork,
    getNetworkSnapshot,
    getNetworkServerSnapshot
  );

  const fetchAtmosphericData = useCallback(
    async (city: CityLocation, standard: AqiStandard, forceRefresh = false) => {
      // If browser is offline, restore from cache
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as AirQualityData;
            setAirData(parsed);
            setError(null);
            setLoading(false);
            return;
          } catch {
            // ignore
          }
        }
        setError("You are currently offline and no local atmospheric cache is present.");
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
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data: AirQualityData = await res.json();
        setAirData(data);
        setError(null);

        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
      } catch (err) {
        console.warn("API fetch error, trying offline fallback:", err);
        let restoredFromCache = false;
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as AirQualityData;
              setAirData(parsed);
              setError(null);
              restoredFromCache = true;
            } catch {
              // ignore
            }
          }
        }

        if (!restoredFromCache) {
          setError(
            "Unable to sync live atmospheric data from Open-Meteo. Please check your network connection or try refreshing."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

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
      const customLoc: CityLocation = {
        id: `custom-coords-${lat.toFixed(2)}-${lon.toFixed(2)}`,
        name: name || `Coords (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        region: "Custom Coordinates",
        country: "Manual Coordinates",
        lat,
        lon,
        isCustomCoordinates: true,
      };
      setSelectedCity(customLoc);
    },
    []
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
      }}
    >
      {children}
    </AirQualityContext.Provider>
  );
}

export function useAirQuality() {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error("useAirQuality must be used within an AirQualityProvider");
  }
  return context;
}
