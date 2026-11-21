import { NextRequest, NextResponse } from "next/server";
import {
  calculateCarbonSavings,
  calculateExposureAvoided,
  calculateEnergySaved,
} from "@/lib/intelligence/impact-formulas";
import { explainImpactWithGemini } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limiter";

async function processImpactRequest(
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

  const distance = parseFloat(
    (bodyData?.distance as string) || searchParams.get("distance") || "0"
  );
  const mode =
    ((bodyData?.mode as string) ||
      searchParams.get("mode") ||
      "transit") as "transit" | "cycling" | "ev";
  const outdoorAqi = parseFloat(
    (bodyData?.outdoorAqi as string) || searchParams.get("outdoorAqi") || "100"
  );
  const duration = parseFloat(
    (bodyData?.duration as string) || searchParams.get("duration") || "1"
  );
  const isProtected =
    (bodyData?.protected as boolean) ?? searchParams.get("protected") === "true";
  const hoursSealed = parseFloat(
    (bodyData?.hoursSealed as string) || searchParams.get("hoursSealed") || "0"
  );
  const lang =
    ((bodyData?.lang as string) ||
      searchParams.get("lang") ||
      "en") === "hi"
      ? "hi"
      : "en";

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

  // AI explanation of environmental impact
  const aiInsights = await explainImpactWithGemini(stats, lang);

  return NextResponse.json(
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
    return await processImpactRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    console.error("Impact API Error:", error);
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
    console.error("Impact API Error:", error);
    return NextResponse.json(
      { error: "Failed to calculate environmental impact" },
      { status: 500 }
    );
  }
}
