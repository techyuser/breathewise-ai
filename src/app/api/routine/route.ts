import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { generateStructuredRoutineWithGemini, verifyPlanWithGemini, UserProfileContext } from "@/lib/gemini";
import { UserPlanInput } from "@/lib/intelligence/plan-verifier";
import { AirQualityData, AqiStandard } from "@/types/air-quality";
import { checkRateLimit } from "@/lib/rate-limiter";

async function processRoutineRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  // 1. Rate Limiting Consideration
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
  const latParam = (bodyData?.lat as string) || searchParams.get("lat");
  const lonParam = (bodyData?.lon as string) || searchParams.get("lon");

  const sensitivity =
    (bodyData?.sensitivity as UserProfileContext["sensitivity"]) ||
    (searchParams.get("sensitivity") as UserProfileContext["sensitivity"]) ||
    "general";

  const profile: UserProfileContext = {
    sensitivity,
    hasAirPurifier: (bodyData?.hasAirPurifier as boolean) ?? searchParams.get("hasAirPurifier") === "true",
    hasN95Mask: (bodyData?.hasN95Mask as boolean) ?? searchParams.get("hasN95Mask") === "true",
    homeVentilation:
      (bodyData?.homeVentilation as "open" | "sealed") ||
      (searchParams.get("homeVentilation") as "open" | "sealed") ||
      "sealed",
  };

  let aqiData: AirQualityData;

  if (bodyData?.aqiData && typeof bodyData.aqiData === "object") {
    aqiData = bodyData.aqiData as AirQualityData;
  } else if (latParam && lonParam) {
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    aqiData = await fetchLiveAirQuality(
      {
        id: "custom",
        name: "Custom Location",
        region: "",
        country: "",
        lat,
        lon,
        isCustomGps: true,
      },
      standard || undefined
    );
  } else {
    const city = PRESET_CITIES.find((c) => c.id === cityId) || PRESET_CITIES[0];
    aqiData = await fetchLiveAirQuality(city, standard || undefined);
  }

  if (bodyData?.plan || bodyData?.action === "verify_plan") {
    const rawPlan = (bodyData.plan || bodyData) as Record<string, unknown>;
    const sanitizedPlan: UserPlanInput = {
      activityName: String(rawPlan.activityName || "Outdoor Activity").slice(0, 120),
      plannedTime: String(rawPlan.plannedTime || "08:00 AM"),
      durationMinutes: Number(rawPlan.durationMinutes) || 30,
      environment: ["outdoor", "indoor_unfiltered", "indoor_hepa", "transit"].includes(rawPlan.environment as string)
        ? (rawPlan.environment as UserPlanInput["environment"])
        : "outdoor",
      intensity: ["light", "moderate", "vigorous"].includes(rawPlan.intensity as string)
        ? (rawPlan.intensity as UserPlanInput["intensity"])
        : "moderate",
      cohort: ["general", "infant", "kids", "asthma", "elderly", "athlete"].includes(rawPlan.cohort as string)
        ? (rawPlan.cohort as UserPlanInput["cohort"])
        : "general",
      hasN95Mask: Boolean(rawPlan.hasN95Mask),
    };

    const verified = await verifyPlanWithGemini(
      sanitizedPlan,
      aqiData,
      lang === "hi" ? "hi" : "en"
    );

    return NextResponse.json(verified, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  }

  const routine = await generateStructuredRoutineWithGemini(
    aqiData,
    profile,
    lang === "hi" ? "hi" : "en"
  );

  return NextResponse.json(routine, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    return await processRoutineRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    console.error("Routine API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate structured routine" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await processRoutineRequest(req.nextUrl.searchParams, req, body);
  } catch (error) {
    console.error("Routine API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate structured routine" },
      { status: 500 }
    );
  }
}
