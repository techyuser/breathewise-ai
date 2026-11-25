import { NextRequest, NextResponse } from "next/server";
import { generateIndoorAdviceWithGemini } from "@/lib/gemini";
import { HomeConfig } from "@/lib/intelligence/indoor-assessment";
import { AqiStandard } from "@/types/air-quality";
import {
  guardRateLimit,
  jsonApiResponse,
  resolveRouteAirQuality,
} from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

async function processIndoorRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  const rateLimit = guardRateLimit(req, 40);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const lang = ((bodyData?.lang as string) || searchParams.get("lang")) === "hi" ? "hi" : "en";
  const standard = ((bodyData?.standard as string) || searchParams.get("standard")) as AqiStandard | null;

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

  const resolved = await resolveRouteAirQuality({
    providedAqiData: bodyData?.aqiData,
    cityId: (bodyData?.cityId as string) || searchParams.get("city") || "delhi",
    latParam: bodyData?.lat ?? searchParams.get("lat"),
    lonParam: bodyData?.lon ?? searchParams.get("lon"),
    standard,
  });
  if ("errorResponse" in resolved) return resolved.errorResponse;

  const recommendations = await generateIndoorAdviceWithGemini(
    resolved.aqiData,
    homeConfig,
    lang
  );
  return jsonApiResponse({ recommendations }, 300, rateLimit.remaining);
}

export async function GET(req: NextRequest) {
  try {
    return await processIndoorRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    logger.error("IndoorAPI", error);
    return NextResponse.json({ error: "Failed to assess indoor air quality" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await processIndoorRequest(req.nextUrl.searchParams, req, body);
  } catch (error) {
    logger.error("IndoorAPI", error);
    return NextResponse.json({ error: "Failed to assess indoor air quality" }, { status: 500 });
  }
}
