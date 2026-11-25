import { NextRequest, NextResponse } from "next/server";
import { verifyPlanWithGemini } from "@/lib/gemini";
import { AqiStandard } from "@/types/air-quality";
import {
  guardRateLimit,
  jsonApiResponse,
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

    const { plan, cityId = "delhi", lat, lon, standard, lang = "en", aqiData } = body;
    if (!plan || typeof plan !== "object" || !plan.activityName) {
      return NextResponse.json(
        { error: "Missing required plan fields (e.g. activityName, plannedTime)." },
        { status: 400 }
      );
    }

    const resolved = await resolveRouteAirQuality({
      providedAqiData: aqiData,
      cityId,
      latParam: lat,
      lonParam: lon,
      standard: standard as AqiStandard | undefined,
    });
    if ("errorResponse" in resolved) return resolved.errorResponse;

    const result = await verifyPlanWithGemini(
      sanitizePlanInput(plan as Record<string, unknown>),
      resolved.aqiData,
      lang === "hi" ? "hi" : "en"
    );

    return jsonApiResponse(result, 120, rateLimit.remaining);
  } catch (error) {
    logger.error("PlanVerifyAPI", error);
    return NextResponse.json({ error: "Failed to verify plan" }, { status: 500 });
  }
}
