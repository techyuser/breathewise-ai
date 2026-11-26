import { NextRequest, NextResponse } from "next/server";
import { verifyPlanWithGemini } from "@/lib/gemini";
import {
  guardRateLimit,
  jsonApiResponse,
  parseAqiStandard,
  parseStringWithFallback,
  resolveRouteAirQuality,
  sanitizePlanInput,
} from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = guardRateLimit(req, 40);
    if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const { plan, cityId, lat, lon, standard, lang, aqiData } = body;
    if (!plan || typeof plan !== "object" || !("activityName" in plan) || !plan.activityName) {
      return NextResponse.json(
        { error: "Missing required plan fields (e.g. activityName, plannedTime)." },
        { status: 400 }
      );
    }

    const safeCityId = parseStringWithFallback(cityId, "delhi", 60);
    const safeLang: "en" | "hi" = parseStringWithFallback(lang, "en", 10) === "hi" ? "hi" : "en";
    const safeStandard = parseAqiStandard(standard);

    const resolved = await resolveRouteAirQuality({
      providedAqiData: aqiData,
      cityId: safeCityId,
      latParam: lat,
      lonParam: lon,
      standard: safeStandard,
    });
    if ("errorResponse" in resolved) return resolved.errorResponse;

    const safePlan = sanitizePlanInput(plan as Record<string, unknown>);
    const result = await verifyPlanWithGemini(safePlan, resolved.aqiData, safeLang);

    return jsonApiResponse(result, 120, rateLimit.remaining);
  } catch (error) {
    logger.error("PlanVerifyAPI", error);
    return NextResponse.json({ error: "Failed to verify plan" }, { status: 500 });
  }
}
