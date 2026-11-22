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
  requestLocationPermission: () => Promise<boolean>;
  isLocating: boolean;
  locationError: string | null;
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
  const [selectedCity, setSelectedCityState] = useState<CityLocation>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCity = localStorage.getItem("breathewise_selected_city");
        if (savedCity) {
          return JSON.parse(savedCity) as CityLocation;
        }
        const savedLoc = localStorage.getItem("breathewise_saved_location");
        if (savedLoc) {
          return JSON.parse(savedLoc) as CityLocation;
        }
      } catch (_err) {
        // Safe fallback when localStorage is restricted or in private browsing
      }
    }
    return PRESET_CITIES[0];
  });

  const setSelectedCity = useCallback((city: CityLocation) => {
    setSelectedCityState(city);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("breathewise_selected_city", JSON.stringify(city));
        localStorage.setItem("breathewise_saved_location", JSON.stringify(city));
      } catch (_err) {
        // Safe fallback when localStorage is restricted or in private browsing
      }
    }
  }, []);
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
          } catch (_err) {
            // Ignore corrupted cached state and proceed to network sync
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
            } catch (_err) {
              // Ignore corrupted cached state
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

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false;
    }

    setIsLocating(true);
    setLocationError(null);

    const applyLocation = (loc: CityLocation) => {
      setSelectedCity(loc);
      setIsLocating(false);
      setLocationError(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("breathewise_use_gps", "true");
          localStorage.setItem("breathewise_saved_location", JSON.stringify(loc));
          localStorage.setItem("breathewise_selected_city", JSON.stringify(loc));
        } catch (_err) {
          // Ignore localStorage quota errors
        }
      }
    };

    // Helper: IP-based location detection fallback
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
        console.warn("IP Geolocation fallback failed:", err);
      }
      return false;
    };

    // If browser doesn't support navigator.geolocation, use IP fallback immediately
    if (!navigator.geolocation) {
      const ipOk = await tryIpFallback();
      if (!ipOk) {
        setIsLocating(false);
        setLocationError("Location detection is not supported. Please select your city from the location menu.");
        return false;
      }
      return true;
    }

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const fallbackToIp = async (errNotice?: string) => {
        if (resolved) return;
        resolved = true;
        const ipSuccess = await tryIpFallback();
        if (ipSuccess) {
          resolve(true);
        } else {
          setIsLocating(false);
          setLocationError(
            errNotice ||
            "Unable to retrieve coordinates. Please search for your city in the location menu."
          );
          resolve(false);
        }
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
            // Ignore reverse geocode failures and fallback to coordinate labels
          }

          const userLoc: CityLocation = {
            id: `gps-${lat}-${lon}`,
            name: `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
            region: "Detected Location",
            country: "",
            lat,
            lon,
            isCustomGps: true,
          };

          applyLocation(userLoc);
          resolve(true);
        },
        async (err) => {
          // If denied, unavailable, or timed out, seamlessly fall back to IP-based location
          const notice =
            err.code === err.PERMISSION_DENIED
              ? "Browser location permission denied. Switched to network location."
              : "GPS signal timed out. Switched to network location.";
          await fallbackToIp(notice);
        },
        // enableHighAccuracy: false ensures instant resolution on laptops/Macs without GPS chipsets
        { timeout: 7000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    });
  }, [setSelectedCity]);

  const hasAutoRequestedRef = React.useRef(false);

  // Automatically ask for location permission after the site is opened
  useEffect(() => {
    if (typeof window === "undefined" || hasAutoRequestedRef.current) return;

    // Only trigger auto-prompt on the main site landing
    const isLanding = window.location.pathname === "/" || window.location.pathname === "/overview";
    if (!isLanding) return;

    const autoPrompted = sessionStorage.getItem("breathewise_auto_location_prompted");
    if (!autoPrompted) {
      hasAutoRequestedRef.current = true;
      sessionStorage.setItem("breathewise_auto_location_prompted", "true");
      // Defer to asynchronous execution to avoid synchronous state updates in the effect body
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

export function useAirQuality() {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error("useAirQuality must be used within an AirQualityProvider");
  }
  return context;
}
