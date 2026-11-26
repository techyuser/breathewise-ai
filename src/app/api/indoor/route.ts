import { NextRequest, NextResponse } from "next/server";
import { generateIndoorAdviceWithGemini } from "@/lib/gemini";
import { HomeConfig } from "@/lib/intelligence/indoor-assessment";
import {
  guardRateLimit,
  jsonApiResponse,
  parseAqiStandard,
  parseBooleanWithFallback,
  parseStringWithFallback,
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

  const langRaw = parseStringWithFallback(bodyData?.lang ?? searchParams.get("lang"), "en", 10);
  const lang: "en" | "hi" = langRaw === "hi" ? "hi" : "en";
  const standard = parseAqiStandard(bodyData?.standard ?? searchParams.get("standard"));

  const homeConfig: HomeConfig = {
    hasAirPurifier: parseBooleanWithFallback(
      bodyData?.hasAirPurifier ?? bodyData?.purifier ?? searchParams.get("purifier"),
      false
    ),
    windowsOpen: parseBooleanWithFallback(
      bodyData?.windowsOpen ?? searchParams.get("windowsOpen"),
      false
    ),
    isCooking: parseBooleanWithFallback(
      bodyData?.isCooking ?? bodyData?.cooking ?? searchParams.get("cooking"),
      false
    ),
    hasInfiltration: parseBooleanWithFallback(
      bodyData?.hasInfiltration ?? bodyData?.infiltration ?? searchParams.get("infiltration"),
      false
    ),
  };

  const resolved = await resolveRouteAirQuality({
    providedAqiData: bodyData?.aqiData,
    cityId: parseStringWithFallback(bodyData?.cityId ?? searchParams.get("city"), "delhi", 60),
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
