import { NextRequest, NextResponse } from "next/server";
import { streamAirIntelligence, AssistantMessage, UserProfileContext } from "@/lib/gemini";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { AirQualityData, AqiStandard, CityLocation } from "@/types/air-quality";
import { checkRateLimit } from "@/lib/rate-limiter";

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

export async function POST(req: NextRequest) {
  // 1. Instance-level Rate Limiting Consideration with Retry-After header
  const rateLimit = checkRateLimit(req, 40);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait before submitting more queries.",
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetInSeconds.toString(),
        },
      }
    );
  }

  try {
    // 2. Strict Request Validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const {
      messages,
      cityId = "delhi",
      lat,
      lon,
      standard,
      profile,
      lang = "en",
    } = body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return NextResponse.json(
        { error: "Field 'messages' must be an array of 1 to 20 message objects." },
        { status: 400 }
      );
    }

    // Validate individual messages: role, content type, content length
    const sanitizedMessages: AssistantMessage[] = [];
    for (const m of messages) {
      if (
        !m ||
        typeof m !== "object" ||
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string"
      ) {
        return NextResponse.json(
          { error: "Each message must have role ('user' or 'assistant') and string content." },
          { status: 400 }
        );
      }
      if (m.content.trim().length === 0 || m.content.length > 1500) {
        return NextResponse.json(
          { error: "Message content must be between 1 and 1500 characters." },
          { status: 400 }
        );
      }
      sanitizedMessages.push({
        id: typeof m.id === "string" ? m.id : `msg-${Date.now()}-${sanitizedMessages.length}`,
        role: m.role,
        content: m.content.trim(),
        timestamp: typeof m.timestamp === "string" ? m.timestamp : new Date().toISOString(),
      });
    }

    const targetLang: "en" | "hi" = lang === "hi" ? "hi" : "en";

    // Validate User Profile
    const userProfile: UserProfileContext = {};
    if (profile && typeof profile === "object") {
      if (profile.cohort && VALID_COHORTS.has(profile.cohort)) {
        userProfile.cohort = profile.cohort;
      }
      if (profile.commuteMode && VALID_COMMUTE_MODES.has(profile.commuteMode)) {
        userProfile.commuteMode = profile.commuteMode;
      }
      if (typeof profile.hasKids === "boolean") userProfile.hasKids = profile.hasKids;
      if (typeof profile.hasElderly === "boolean") userProfile.hasElderly = profile.hasElderly;
      if (typeof profile.hasRespiratory === "boolean") userProfile.hasRespiratory = profile.hasRespiratory;
      if (typeof profile.hasAirPurifier === "boolean") userProfile.hasAirPurifier = profile.hasAirPurifier;
      if (typeof profile.commuteDistanceKm === "number" && profile.commuteDistanceKm >= 0 && profile.commuteDistanceKm <= 200) {
        userProfile.commuteDistanceKm = profile.commuteDistanceKm;
      }
    }

    // 3. Resolve Real Environmental Data Server-Side ONLY
    // Security & Data Integrity: Never trust arbitrary client-supplied AQI values.
    // Always fetch authentic atmospheric data server-side from Open-Meteo.
    let targetCity: CityLocation;

    if (lat !== undefined && lon !== undefined) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return NextResponse.json({ error: "Invalid latitude or longitude coordinates." }, { status: 400 });
      }
      const matchedCity = PRESET_CITIES.find(
        (c) => Math.abs(c.lat - parsedLat) < 0.1 && Math.abs(c.lon - parsedLon) < 0.1
      );
      targetCity = matchedCity || {
        id: `coord-${parsedLat.toFixed(2)}-${parsedLon.toFixed(2)}`,
        name: `Coordinates (${parsedLat.toFixed(2)}°, ${parsedLon.toFixed(2)}°)`,
        region: "Custom Region",
        country: "Coordinates",
        lat: parsedLat,
        lon: parsedLon,
        isCustomCoordinates: true,
      };
    } else {
      const found = PRESET_CITIES.find((c) => c.id === cityId);
      targetCity = found || PRESET_CITIES[0];
    }

    const standardParam: AqiStandard | undefined =
      standard === "INDIA_CPCB" || standard === "US_EPA" ? standard : undefined;

    // Fetch verified atmospheric telemetry from Open-Meteo server-side
    const aqiData: AirQualityData = await fetchLiveAirQuality(targetCity, standardParam);

    // 4. Stream AI Response from Gemini or Deterministic Fallback Engine
    const { stream, engine } = await streamAirIntelligence(
      sanitizedMessages,
      aqiData,
      userProfile,
      targetLang
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream reader error:", err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-AI-Engine": engine,
      },
    });
  } catch (error) {
    console.error("Assistant API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process air quality intelligence query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
