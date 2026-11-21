import { NextRequest, NextResponse } from "next/server";
import { CityLocation } from "@/types/air-quality";

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
}

// In-memory cache for search queries
const searchCache = new Map<string, { results: CityLocation[]; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 mins

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const cacheKey = q.toLowerCase();
    const now = Date.now();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      if (cached.expiresAt > now) {
        return NextResponse.json(cached.results);
      }
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=8&language=en&format=json`;

    const res = await fetch(geoUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    const rawResults: OpenMeteoGeocodingResult[] = data.results || [];

    const locations: CityLocation[] = rawResults.map((item) => {
      const isIndia = item.country?.toLowerCase() === "india" || item.country_code?.toUpperCase() === "IN";
      return {
        id: `geo-${item.id}`,
        name: item.name,
        region: item.admin1 || item.admin2 || item.country || "",
        country: item.country || item.country_code || "",
        lat: Number(item.latitude.toFixed(4)),
        lon: Number(item.longitude.toFixed(4)),
        isIndianCity: isIndia,
      };
    });

    searchCache.set(cacheKey, {
      results: locations,
      expiresAt: now + CACHE_TTL,
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json([]);
  }
}
