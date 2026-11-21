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

// In-memory cache for search queries and reverse lookups
const searchCache = new Map<string, { results: CityLocation[]; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 mins

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim();
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const isIp = searchParams.get("ip") === "true";

    // 1. IP Geolocation Lookup
    if (isIp) {
      try {
        const forwarded = req.headers.get("x-forwarded-for");
        const clientIp = forwarded ? forwarded.split(",")[0].trim() : "";
        const targetUrl =
          clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1" && !clientIp.startsWith("192.168.")
            ? `https://ipwho.is/${clientIp}`
            : "https://ipwho.is/";

        const ipRes = await fetch(targetUrl, { headers: { Accept: "application/json" } });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.success !== false && typeof ipData.latitude === "number") {
            const loc: CityLocation = {
              id: `ip-${ipData.latitude.toFixed(3)}-${ipData.longitude.toFixed(3)}`,
              name: ipData.city || ipData.region || "Local Area",
              region: ipData.region || "",
              country: ipData.country || "",
              lat: Number(ipData.latitude.toFixed(4)),
              lon: Number(ipData.longitude.toFixed(4)),
              isIndianCity: ipData.country_code?.toUpperCase() === "IN" || ipData.country?.toLowerCase() === "india",
              isCustomGps: true,
            };
            return NextResponse.json({ success: true, location: loc, source: "ip" });
          }
        }
      } catch (err) {
        console.warn("IP Geolocation error:", err);
      }

      // Default fallback if IP service is unreachable
      return NextResponse.json(
        { success: false, error: "Unable to determine location from IP" },
        { status: 502 }
      );
    }

    // 2. Reverse Geocoding Lookup (lat + lon -> City Name)
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);

      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
      }

      // Try BigDataCloud reverse geocode
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

          const loc: CityLocation = {
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
          };
          return NextResponse.json({ success: true, location: loc });
        }
      } catch (err) {
        console.warn("Reverse geocode fetch failed:", err);
      }

      // Fallback response with coordinates
      return NextResponse.json({
        success: true,
        location: {
          id: `coords-${lat.toFixed(3)}-${lon.toFixed(3)}`,
          name: `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          region: "Detected Coordinates",
          country: "",
          lat,
          lon,
          isIndianCity: lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97,
          isCustomGps: true,
        },
      });
    }

    // 3. Search query lookup
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
      const isIndia =
        item.country?.toLowerCase() === "india" || item.country_code?.toUpperCase() === "IN";
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
