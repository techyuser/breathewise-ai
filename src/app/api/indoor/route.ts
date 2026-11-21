import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { generateIndoorAdviceWithGemini } from "@/lib/gemini";
import { HomeConfig } from "@/lib/intelligence/indoor-assessment";
import { AirQualityData, AqiStandard } from "@/types/air-quality";
import { checkRateLimit } from "@/lib/rate-limiter";

async function processIndoorRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  const rateLimit = checkRateLimit(req, 40);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait.", retryAfter: rateLimit.resetInSeconds },
      { status: 429, headers: { "Retry-After": rateLimit.resetInSeconds.toString() } }
    );
  }

  const cityId = (bodyData?.cityId as string) || searchParams.get("city") || "delhi";
  const lang = (bodyData?.lang as "en" | "hi") || (searchParams.get("lang") as "en" | "hi") || "en";
  const standard = (bodyData?.standard as AqiStandard) || (searchParams.get("standard") as AqiStandard | null);
  const lat = (bodyData?.lat as string) || searchParams.get("lat");
  const lon = (bodyData?.lon as string) || searchParams.get("lon");

  const homeConfig: HomeConfig = {
    hasAirPurifier:
      (bodyData?.hasAirPurifier as boolean) ??
      (bodyData?.purifier as boolean) ??
      searchParams.get("purifier") === "true",
    windowsOpen:
      (bodyData?.windowsOpen as boolean) ?? searchParams.get("windowsOpen") === "true",
    isCooking:
      (bodyData?.isCooking as boolean) ??
      (bodyData?.cooking as boolean) ??
      searchParams.get("cooking") === "true",
    hasInfiltration:
      (bodyData?.hasInfiltration as boolean) ??
      (bodyData?.infiltration as boolean) ??
      searchParams.get("infiltration") === "true",
  };

  let aqiData: AirQualityData;

  if (bodyData?.aqiData && typeof bodyData.aqiData === "object") {
    aqiData = bodyData.aqiData as AirQualityData;
  } else if (lat && lon) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    aqiData = await fetchLiveAirQuality(
      {
        id: "custom",
        name: "Custom Location",
        region: "",
        country: "",
        lat: parsedLat,
        lon: parsedLon,
        isCustomGps: true,
      },
      standard || undefined
    );
  } else {
    const city = PRESET_CITIES.find((c) => c.id === cityId) || PRESET_CITIES[0];
    aqiData = await fetchLiveAirQuality(city, standard || undefined);
  }

  const recommendations = await generateIndoorAdviceWithGemini(
    aqiData,
    homeConfig,
    lang === "hi" ? "hi" : "en"
  );

  return NextResponse.json(
    { recommendations },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    return await processIndoorRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    console.error("Indoor Assessment API Error:", error);
    return NextResponse.json(
      { error: "Failed to assess indoor air quality" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await processIndoorRequest(req.nextUrl.searchParams, req, body);
  } catch (error) {
    console.error("Indoor Assessment API Error:", error);
    return NextResponse.json(
      { error: "Failed to assess indoor air quality" },
      { status: 500 }
    );
  }
}
