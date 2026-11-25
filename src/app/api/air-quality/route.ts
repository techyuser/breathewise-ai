import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAirQuality } from "@/lib/open-meteo";
import { resolveTargetCity } from "@/lib/api-helpers";
import { AirQualityData, AqiStandard } from "@/types/air-quality";
import { logger } from "@/lib/logger";

interface CacheEntry {
  data: AirQualityData;
  expiresAt: number;
}

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
    const standardParam = searchParams.get("standard") as AqiStandard | null;
    const forceRefresh = searchParams.get("refresh") === "true";

    const cityResult = resolveTargetCity({
      cityId: searchParams.get("city") || "delhi",
      latParam: searchParams.get("lat"),
      lonParam: searchParams.get("lon"),
      nameParam: searchParams.get("name"),
    });
    if ("errorResponse" in cityResult) return cityResult.errorResponse;

    const targetCity = cityResult.city;
    const cacheKey = `${targetCity.id}:${targetCity.lat.toFixed(3)}:${targetCity.lon.toFixed(3)}:${standardParam || "AUTO"}`;
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
      }
      memoryCache.delete(cacheKey);
    }

    const aqiData = await fetchLiveAirQuality(targetCity, standardParam || undefined);
    memoryCache.set(cacheKey, { data: aqiData, expiresAt: now + CACHE_TTL_MS });

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
    logger.error("AirQualityAPI", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live atmospheric data from Open-Meteo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
