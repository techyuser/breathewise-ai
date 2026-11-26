import { NextRequest, NextResponse } from "next/server";
import {
  calculateCarbonSavings,
  calculateExposureAvoided,
  calculateEnergySaved,
} from "@/lib/intelligence/impact-formulas";
import { explainImpactWithGemini } from "@/lib/gemini";
import {
  guardRateLimit,
  jsonApiResponse,
  parseBooleanWithFallback,
  parseNumberWithFallback,
  parseStringWithFallback,
} from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

async function processImpactRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  const rateLimit = guardRateLimit(req, 40);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const distance = parseNumberWithFallback(
    bodyData?.distance ?? searchParams.get("distance"),
    0,
    0,
    1000
  );
  const rawMode = parseStringWithFallback(
    bodyData?.mode ?? searchParams.get("mode"),
    "transit",
    20
  );
  const mode: "transit" | "cycling" | "ev" =
    rawMode === "cycling" || rawMode === "ev" ? rawMode : "transit";

  const outdoorAqi = parseNumberWithFallback(
    bodyData?.outdoorAqi ?? searchParams.get("outdoorAqi"),
    100,
    0,
    1000
  );
  const duration = parseNumberWithFallback(
    bodyData?.duration ?? searchParams.get("duration"),
    1,
    0,
    24
  );
  const isProtected = parseBooleanWithFallback(
    bodyData?.protected ?? searchParams.get("protected"),
    false
  );
  const hoursSealed = parseNumberWithFallback(
    bodyData?.hoursSealed ?? searchParams.get("hoursSealed"),
    0,
    0,
    24
  );
  const langRaw = parseStringWithFallback(
    bodyData?.lang ?? searchParams.get("lang"),
    "en",
    10
  );
  const lang: "en" | "hi" = langRaw === "hi" ? "hi" : "en";

  const co2Saved = calculateCarbonSavings(distance, mode);
  const exposureAvoided = calculateExposureAvoided(outdoorAqi, duration, isProtected);
  const energyOptimized = calculateEnergySaved(hoursSealed);

  const stats = {
    co2Saved: Number(co2Saved.toFixed(2)),
    exposureAvoided,
    energyOptimized: Number(energyOptimized.toFixed(2)),
    distance,
    mode,
  };

  const aiInsights = await explainImpactWithGemini(stats, lang);

  return jsonApiResponse(
    {
      ...stats,
      aiExplanation: aiInsights.explanation,
      cleanAirTips: aiInsights.tips,
      breakdown: {
        commute: { distance, mode, co2Saved: stats.co2Saved },
        exposure: { outdoorAqi, duration, protected: isProtected, exposureAvoided },
        energy: { hoursSealed, energyOptimized: stats.energyOptimized },
      },
    },
    300,
    rateLimit.remaining
  );
}

export async function GET(req: NextRequest) {
  try {
    return await processImpactRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    logger.error("ImpactAPI", error);
    return NextResponse.json(
      { error: "Failed to calculate environmental impact" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await processImpactRequest(req.nextUrl.searchParams, req, body);
  } catch (error) {
    logger.error("ImpactAPI", error);
    return NextResponse.json(
      { error: "Failed to calculate environmental impact" },
      { status: 500 }
    );
  }
}
