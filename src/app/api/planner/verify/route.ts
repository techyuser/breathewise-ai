import { NextRequest, NextResponse } from "next/server";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { verifyPlanWithGemini } from "@/lib/gemini";
import { UserPlanInput, verifyPlanDeterministic } from "@/lib/intelligence/plan-verifier";
import { AirQualityData, AqiStandard } from "@/types/air-quality";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const rateLimit = checkRateLimit(req, 40);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait.", retryAfter: rateLimit.resetInSeconds },
        { status: 429, headers: { "Retry-After": rateLimit.resetInSeconds.toString() } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const {
      plan,
      cityId = "delhi",
      lat,
      lon,
      standard,
      lang = "en",
      aqiData: providedAqiData,
    } = body;

    if (!plan || typeof plan !== "object" || !plan.activityName) {
      return NextResponse.json(
        { error: "Missing required plan fields (e.g. activityName, plannedTime)." },
        { status: 400 }
      );
    }

    const sanitizedPlan: UserPlanInput = {
      activityName: String(plan.activityName).slice(0, 120),
      plannedTime: String(plan.plannedTime || "08:00 AM"),
      durationMinutes: Number(plan.durationMinutes) || 30,
      environment: ["outdoor", "indoor_unfiltered", "indoor_hepa", "transit"].includes(plan.environment)
        ? plan.environment
        : "outdoor",
      intensity: ["light", "moderate", "vigorous"].includes(plan.intensity)
        ? plan.intensity
        : "moderate",
      cohort: ["general", "infant", "kids", "asthma", "elderly", "athlete"].includes(plan.cohort)
        ? plan.cohort
        : "general",
      hasN95Mask: Boolean(plan.hasN95Mask),
    };

    let aqiData: AirQualityData;
    if (providedAqiData && typeof providedAqiData === "object" && providedAqiData.city) {
      aqiData = providedAqiData as AirQualityData;
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

    const result = await verifyPlanWithGemini(
      sanitizedPlan,
      aqiData,
      lang === "hi" ? "hi" : "en"
    );

    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Plan Verification API Error:", error);
    return NextResponse.json(
      { error: "Failed to verify plan" },
      { status: 500 }
    );
  }
}
