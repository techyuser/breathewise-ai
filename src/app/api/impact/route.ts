import { NextRequest, NextResponse } from "next/server";
import {
  calculateCarbonSavings,
  calculateExposureAvoided,
  calculateEnergySaved,
} from "@/lib/intelligence/impact-formulas";
import { explainImpactWithGemini } from "@/lib/gemini";
import { guardRateLimit, jsonApiResponse } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

async function processImpactRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  const rateLimit = guardRateLimit(req, 40);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const distance = parseFloat(String(bodyData?.distance ?? searchParams.get("distance") ?? "0"));
  const mode = String(
    bodyData?.mode ?? searchParams.get("mode") ?? "transit"
  ) as "transit" | "cycling" | "ev";
  const outdoorAqi = parseFloat(
    String(bodyData?.outdoorAqi ?? searchParams.get("outdoorAqi") ?? "100")
  );
  const duration = parseFloat(String(bodyData?.duration ?? searchParams.get("duration") ?? "1"));
  const isProtected =
    (bodyData?.protected as boolean) ?? searchParams.get("protected") === "true";
  const hoursSealed = parseFloat(
    String(bodyData?.hoursSealed ?? searchParams.get("hoursSealed") ?? "0")
  );
  const lang = String(bodyData?.lang ?? searchParams.get("lang") ?? "en") === "hi" ? "hi" : "en";

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
