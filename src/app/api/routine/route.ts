import { NextRequest, NextResponse } from "next/server";
import {
  generateStructuredRoutineWithGemini,
  verifyPlanWithGemini,
  UserProfileContext,
} from "@/lib/gemini";
import {
  guardRateLimit,
  jsonApiResponse,
  parseAqiStandard,
  parseBooleanWithFallback,
  parseStringWithFallback,
  resolveRouteAirQuality,
  sanitizePlanInput,
} from "@/lib/api-helpers";
import { logger } from "@/lib/logger";

async function processRoutineRequest(
  searchParams: URLSearchParams,
  req: NextRequest,
  bodyData?: Record<string, unknown>
) {
  const rateLimit = guardRateLimit(req, 40);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const langRaw = parseStringWithFallback(bodyData?.lang ?? searchParams.get("lang"), "en", 10);
  const targetLang: "en" | "hi" = langRaw === "hi" ? "hi" : "en";
  const standard = parseAqiStandard(bodyData?.standard ?? searchParams.get("standard"));

  const rawSensitivity = parseStringWithFallback(
    bodyData?.sensitivity ?? searchParams.get("sensitivity"),
    "general",
    30
  );
  const validSensitivity: UserProfileContext["sensitivity"] =
    rawSensitivity === "infant" ||
    rawSensitivity === "respiratory" ||
    rawSensitivity === "elderly" ||
    rawSensitivity === "athlete" ||
    rawSensitivity === "pregnant"
      ? rawSensitivity
      : "general";

  const rawVentilation = parseStringWithFallback(
    bodyData?.homeVentilation ?? searchParams.get("homeVentilation"),
    "sealed",
    10
  );
  const homeVentilation: "open" | "sealed" = rawVentilation === "open" ? "open" : "sealed";

  const profile: UserProfileContext = {
    sensitivity: validSensitivity,
    hasAirPurifier: parseBooleanWithFallback(
      bodyData?.hasAirPurifier ?? searchParams.get("hasAirPurifier"),
      false
    ),
    hasN95Mask: parseBooleanWithFallback(
      bodyData?.hasN95Mask ?? searchParams.get("hasN95Mask"),
      false
    ),
    homeVentilation,
  };

  const resolved = await resolveRouteAirQuality({
    providedAqiData: bodyData?.aqiData,
    cityId: parseStringWithFallback(bodyData?.cityId ?? searchParams.get("city"), "delhi", 60),
    latParam: bodyData?.lat ?? searchParams.get("lat"),
    lonParam: bodyData?.lon ?? searchParams.get("lon"),
    standard,
  });
  if ("errorResponse" in resolved) return resolved.errorResponse;

  if (bodyData?.plan || bodyData?.action === "verify_plan") {
    const rawPlan = (bodyData.plan && typeof bodyData.plan === "object"
      ? bodyData.plan
      : bodyData) as Record<string, unknown>;
    const verified = await verifyPlanWithGemini(
      sanitizePlanInput(rawPlan),
      resolved.aqiData,
      targetLang
    );
    return jsonApiResponse(verified, 120, rateLimit.remaining);
  }

  const routine = await generateStructuredRoutineWithGemini(
    resolved.aqiData,
    profile,
    targetLang
  );
  return jsonApiResponse(routine, 300, rateLimit.remaining);
}

export async function GET(req: NextRequest) {
  try {
    return await processRoutineRequest(req.nextUrl.searchParams, req);
  } catch (error) {
    logger.error("RoutineAPI", error);
    return NextResponse.json({ error: "Failed to generate structured routine" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await processRoutineRequest(req.nextUrl.searchParams, req, body);
  } catch (error) {
    logger.error("RoutineAPI", error);
    return NextResponse.json({ error: "Failed to generate structured routine" }, { status: 500 });
  }
}
