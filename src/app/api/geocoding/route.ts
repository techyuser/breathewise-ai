import { NextRequest, NextResponse } from "next/server";
import { CityLocation } from "@/types/air-quality";
import { parseValidCoordinates } from "@/lib/api-helpers";
import { isLocationInIndia } from "@/lib/constants/cities";
import { logger } from "@/lib/logger";

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
}

const searchCache = new Map<string, { results: CityLocation[]; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

async function handleIpLookup(req: NextRequest): Promise<NextResponse> {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "";
    const isPublicIp =
      clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1" && !clientIp.startsWith("192.168.");
    const targetUrl = isPublicIp ? `https://ipwho.is/${clientIp}` : "https://ipwho.is/";

    const ipRes = await fetch(targetUrl, { headers: { Accept: "application/json" } });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData && ipData.success !== false && typeof ipData.latitude === "number") {
        const location: CityLocation = {
          id: `ip-${ipData.latitude.toFixed(3)}-${ipData.longitude.toFixed(3)}`,
          name: ipData.city || ipData.region || "Local Area",
          region: ipData.region || "",
          country: ipData.country || "",
          lat: Number(ipData.latitude.toFixed(4)),
          lon: Number(ipData.longitude.toFixed(4)),
          isIndianCity:
            ipData.country_code?.toUpperCase() === "IN" ||
            ipData.country?.toLowerCase() === "india",
          isCustomGps: true,
        };
        return NextResponse.json({ success: true, location, source: "ip" });
      }
    }
  } catch (err) {
    logger.warn("GeocodingIP", err);
  }

  return NextResponse.json(
    { success: false, error: "Unable to determine location from IP" },
    { status: 502 }
  );
}

async function handleReverseLookup(lat: number, lon: number): Promise<NextResponse> {
  try {
    const revRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { headers: { Accept: "application/json" } }
    );
    if (revRes.ok) {
      const revData = await revRes.json();
      const cityName =
        revData.locality ||
        revData.city ||
        revData.principalSubdivision ||
        `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;

      return NextResponse.json({
        success: true,
        location: {
          id: `coords-${lat.toFixed(3)}-${lon.toFixed(3)}`,
          name: cityName,
          region: revData.principalSubdivision || "Detected Region",
          country: revData.countryName || "",
          lat,
          lon,
          isIndianCity:
            revData.countryCode?.toUpperCase() === "IN" ||
            revData.countryName?.toLowerCase() === "india",
          isCustomGps: true,
        },
      });
    }
  } catch (err) {
    logger.warn("GeocodingReverse", err);
  }

  return NextResponse.json({
    success: true,
    location: {
      id: `coords-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      name: `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      region: "Detected Coordinates",
      country: "",
      lat,
      lon,
      isIndianCity: isLocationInIndia(lat, lon),
      isCustomGps: true,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    if (searchParams.get("ip") === "true") {
      return handleIpLookup(req);
    }

    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    if (latParam && lonParam) {
      const coords = parseValidCoordinates(latParam, lonParam);
      if (!coords) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
      }
      return handleReverseLookup(coords.lat, coords.lon);
    }

    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const cacheKey = q.toLowerCase();
    const now = Date.now();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.results);
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
    const res = await fetch(geoUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const rawResults: OpenMeteoGeocodingResult[] = data.results || [];
    const locations: CityLocation[] = rawResults.map((item) => ({
      id: `geo-${item.id}`,
      name: item.name,
      region: item.admin1 || item.admin2 || item.country || "",
      country: item.country || item.country_code || "",
      lat: Number(item.latitude.toFixed(4)),
      lon: Number(item.longitude.toFixed(4)),
      isIndianCity:
        item.country?.toLowerCase() === "india" || item.country_code?.toUpperCase() === "IN",
    }));

    searchCache.set(cacheKey, { results: locations, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(locations);
  } catch (error) {
    logger.error("GeocodingAPI", error);
    return NextResponse.json([]);
  }
}
