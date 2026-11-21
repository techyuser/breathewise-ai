import { NextRequest, NextResponse } from "next/server";
import { streamAirIntelligence, AssistantMessage, UserProfileContext } from "@/lib/gemini";
import { fetchLiveAirQuality, PRESET_CITIES } from "@/lib/open-meteo";
import { AirQualityData, AqiStandard } from "@/types/air-quality";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Consideration
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
    // 2. Request Validation
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
      aqiData: clientAqiData,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Field 'messages' must be a non-empty array of message objects." },
        { status: 400 }
      );
    }

    const targetLang: "en" | "hi" = lang === "hi" ? "hi" : "en";
    const userProfile: UserProfileContext = profile || {};

    // 3. Resolve Real Environmental Data
    let aqiData: AirQualityData;

    if (clientAqiData && clientAqiData.pollutants && clientAqiData.usAqi !== undefined) {
      // User passed real client environmental telemetry
      aqiData = clientAqiData;
    } else if (lat !== undefined && lon !== undefined) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        return NextResponse.json({ error: "Invalid latitude or longitude coordinates." }, { status: 400 });
      }
      aqiData = await fetchLiveAirQuality(
        {
          id: "custom",
          name: "Local Coordinates",
          region: "Real Time Coordinate",
          country: "GPS",
          lat: parsedLat,
          lon: parsedLon,
        },
        standard as AqiStandard | undefined
      );
    } else {
      const city = PRESET_CITIES.find((c) => c.id === cityId) || PRESET_CITIES[0];
      aqiData = await fetchLiveAirQuality(city, standard as AqiStandard | undefined);
    }

    // 4. Format Messages
    const assistantMessages: AssistantMessage[] = messages.map(
      (m: { id?: string; role: "user" | "assistant" | "system"; content: string }) => ({
        id: m.id || crypto.randomUUID(),
        role: m.role || "user",
        content: typeof m.content === "string" ? m.content.trim() : "",
        timestamp: new Date().toISOString(),
      })
    );

    // 5. Stream Gemini Intelligence
    const stream = await streamAirIntelligence(
      assistantMessages,
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
