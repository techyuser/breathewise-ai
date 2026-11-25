import { NextRequest, NextResponse } from "next/server";
import { streamAirIntelligence, AssistantMessage, UserProfileContext } from "@/lib/gemini";
import { fetchLiveAirQuality } from "@/lib/open-meteo";
import { guardRateLimit, resolveTargetCity } from "@/lib/api-helpers";
import { AqiStandard } from "@/types/air-quality";
import { logger } from "@/lib/logger";

const VALID_COHORTS = new Set([
  "general",
  "family",
  "asthma",
  "elderly",
  "infant",
  "commuter",
  "athlete",
]);

const VALID_COMMUTE_MODES = new Set([
  "metro",
  "car_ac",
  "bus",
  "two_wheeler",
  "walk",
  "cycling",
]);

function validateMessages(rawMessages: unknown): AssistantMessage[] | null {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 20) {
    return null;
  }

  const sanitized: AssistantMessage[] = [];
  for (const m of rawMessages) {
    if (
      !m ||
      typeof m !== "object" ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string"
    ) {
      return null;
    }
    const trimmed = m.content.trim();
    if (trimmed.length === 0 || m.content.length > 1500) {
      return null;
    }
    sanitized.push({
      id: typeof m.id === "string" ? m.id : `msg-${Date.now()}-${sanitized.length}`,
      role: m.role,
      content: trimmed,
      timestamp: typeof m.timestamp === "string" ? m.timestamp : new Date().toISOString(),
    });
  }
  return sanitized;
}

function sanitizeProfile(rawProfile: unknown): UserProfileContext {
  const userProfile: UserProfileContext = {};
  if (!rawProfile || typeof rawProfile !== "object") return userProfile;

  const p = rawProfile as Record<string, unknown>;
  if (typeof p.cohort === "string" && VALID_COHORTS.has(p.cohort)) {
    userProfile.cohort = p.cohort;
  }
  if (typeof p.commuteMode === "string" && VALID_COMMUTE_MODES.has(p.commuteMode)) {
    userProfile.commuteMode = p.commuteMode;
  }
  if (typeof p.hasKids === "boolean") userProfile.hasKids = p.hasKids;
  if (typeof p.hasElderly === "boolean") userProfile.hasElderly = p.hasElderly;
  if (typeof p.hasRespiratory === "boolean") userProfile.hasRespiratory = p.hasRespiratory;
  if (typeof p.hasAirPurifier === "boolean") userProfile.hasAirPurifier = p.hasAirPurifier;
  if (
    typeof p.commuteDistanceKm === "number" &&
    p.commuteDistanceKm >= 0 &&
    p.commuteDistanceKm <= 200
  ) {
    userProfile.commuteDistanceKm = p.commuteDistanceKm;
  }
  return userProfile;
}

export async function POST(req: NextRequest) {
  const rateLimit = guardRateLimit(
    req,
    40,
    "Rate limit exceeded. Please wait before submitting more queries."
  );
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const sanitizedMessages = validateMessages(body.messages);
    if (!sanitizedMessages) {
      return NextResponse.json(
        {
          error:
            "Field 'messages' must be 1 to 20 valid ('user' | 'assistant') objects with 1-1500 char content.",
        },
        { status: 400 }
      );
    }

    const cityResult = resolveTargetCity({
      cityId: body.cityId || "delhi",
      latParam: body.lat,
      lonParam: body.lon,
      matchPresetThreshold: 0.1,
    });
    if ("errorResponse" in cityResult) return cityResult.errorResponse;

    const standardParam: AqiStandard | undefined =
      body.standard === "INDIA_CPCB" || body.standard === "US_EPA" ? body.standard : undefined;

    // Security & Integrity: Always resolve atmospheric telemetry server-side
    const aqiData = await fetchLiveAirQuality(cityResult.city, standardParam);
    const { stream, engine } = await streamAirIntelligence(
      sanitizedMessages,
      aqiData,
      sanitizeProfile(body.profile),
      body.lang === "hi" ? "hi" : "en"
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let emittedAny = false;
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              emittedAny = true;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          logger.error("AssistantStream", err);
          if (!emittedAny) {
            controller.enqueue(
              encoder.encode(
                "Recommended guidance: Use N95/FFP2 respirators outdoors, seal windows during peak smog, and run HEPA H13 filtration indoors."
              )
            );
          }
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-AI-Engine": engine,
      },
    });
  } catch (error) {
    logger.error("AssistantAPI", error);
    return NextResponse.json(
      {
        error: "Failed to process air quality intelligence query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
