import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { AirQualityData, AqiStandard, CityLocation } from "@/types/air-quality";

interface CacheEntry {
  data: AirQualityData;
  expiresAt: number;
}

// In-memory cache with 5-minute (300,000ms) TTL
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    cleanExpiredCache();

    const searchParams = req.nextUrl.searchParams;
    const cityId = searchParams.get("city") || "delhi";
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const nameParam = searchParams.get("name");
    const standardParam = searchParams.get("standard") as AqiStandard | null;
    const forceRefresh = searchParams.get("refresh") === "true";

    let targetCity: CityLocation;

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json(
          { error: "Invalid latitude or longitude coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180." },
          { status: 400 }
        );
      }

      targetCity = {
        id: `coord-${lat.toFixed(3)}-${lon.toFixed(3)}`,
        name: nameParam || `Coords (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        region: "Custom Location",
        country: "Coordinates",
        lat,
        lon,
        isCustomCoordinates: true,
      };
    } else {
      const foundCity = PRESET_CITIES.find((c) => c.id === cityId);
      targetCity = foundCity || PRESET_CITIES[0];
    }

    const standardKey = standardParam || "AUTO";
    const cacheKey = `${targetCity.id}:${targetCity.lat.toFixed(3)}:${targetCity.lon.toFixed(3)}:${standardKey}`;
    const now = Date.now();

    if (!forceRefresh && memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey)!;
      if (entry.expiresAt > now) {
        return NextResponse.json(
          { ...entry.data, cacheStatus: "HIT" },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
              "X-Cache-Status": "HIT",
            },
          }
        );
      } else {
        memoryCache.delete(cacheKey);
      }
    }

    const aqiData = await fetchLiveAirQuality(
      targetCity,
      standardParam || undefined
    );

    // Save to server-side cache
    memoryCache.set(cacheKey, {
      data: aqiData,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json(
      { ...aqiData, cacheStatus: "MISS" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          "X-Cache-Status": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Air Quality API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live atmospheric data from Open-Meteo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
