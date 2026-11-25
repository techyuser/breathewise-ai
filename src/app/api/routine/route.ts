import { NextRequest, NextResponse } from "next/server";
import {
  generateStructuredRoutineWithGemini,
  verifyPlanWithGemini,
  UserProfileContext,
} from "@/lib/gemini";
import { AqiStandard } from "@/types/air-quality";
import {
  guardRateLimit,
  jsonApiResponse,
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

  const lang = (bodyData?.lang as string) || searchParams.get("lang") || "en";
  const targetLang: "en" | "hi" = lang === "hi" ? "hi" : "en";
  const standard = ((bodyData?.standard as string) || searchParams.get("standard")) as AqiStandard | null;

  const profile: UserProfileContext = {
    sensitivity:
      (bodyData?.sensitivity as UserProfileContext["sensitivity"]) ||
      (searchParams.get("sensitivity") as UserProfileContext["sensitivity"]) ||
      "general",
    hasAirPurifier:
      (bodyData?.hasAirPurifier as boolean) ?? searchParams.get("hasAirPurifier") === "true",
    hasN95Mask: (bodyData?.hasN95Mask as boolean) ?? searchParams.get("hasN95Mask") === "true",
    homeVentilation:
      (bodyData?.homeVentilation as "open" | "sealed") ||
      (searchParams.get("homeVentilation") as "open" | "sealed") ||
      "sealed",
  };

  const resolved = await resolveRouteAirQuality({
    providedAqiData: bodyData?.aqiData,
    cityId: (bodyData?.cityId as string) || searchParams.get("city") || "delhi",
    latParam: bodyData?.lat ?? searchParams.get("lat"),
    lonParam: bodyData?.lon ?? searchParams.get("lon"),
    standard,
  });
  if ("errorResponse" in resolved) return resolved.errorResponse;

  if (bodyData?.plan || bodyData?.action === "verify_plan") {
    const rawPlan = (bodyData.plan || bodyData) as Record<string, unknown>;
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
