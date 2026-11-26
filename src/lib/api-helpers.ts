import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { fetchLiveAirQuality } from "@/lib/open-meteo";
import { PRESET_CITIES } from "@/lib/constants/cities";
import type { UserPlanInput } from "@/lib/intelligence/plan-verifier";
import type { AirQualityData, AqiStandard, CityLocation } from "@/types/air-quality";

const VALID_ENVIRONMENTS = new Set<UserPlanInput["environment"]>([
  "outdoor",
  "indoor_unfiltered",
  "indoor_hepa",
  "transit",
]);

const VALID_INTENSITIES = new Set<UserPlanInput["intensity"]>([
  "light",
  "moderate",
  "vigorous",
]);

const VALID_COHORTS = new Set<UserPlanInput["cohort"]>([
  "general",
  "infant",
  "kids",
  "asthma",
  "elderly",
  "athlete",
]);

export function isValidAqiStandard(val: unknown): val is AqiStandard {
  return val === "INDIA_CPCB" || val === "US_EPA";
}

export function parseAqiStandard(val: unknown): AqiStandard | undefined {
  if (typeof val === "string") {
    const upper = val.trim().toUpperCase();
    if (upper === "INDIA_CPCB" || upper === "IN_NAQI" || upper === "CPCB") return "INDIA_CPCB";
    if (upper === "US_EPA" || upper === "US_AQI" || upper === "EPA") return "US_EPA";
  }
  return undefined;
}

export function parseNumberWithFallback(
  val: unknown,
  fallback: number,
  min = -Infinity,
  max = Infinity
): number {
  if (typeof val === "number" && Number.isFinite(val)) {
    return Math.max(min, Math.min(max, val));
  }
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }
  }
  return fallback;
}

export function parseBooleanWithFallback(val: unknown, fallback: boolean): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  return fallback;
}

export function parseStringWithFallback(val: unknown, fallback: string, maxLength = 250): string {
  if (typeof val === "string") {
    return val.trim().slice(0, maxLength);
  }
  return fallback;
}

export function isValidCohort(val: unknown): val is UserPlanInput["cohort"] {
  return typeof val === "string" && VALID_COHORTS.has(val as UserPlanInput["cohort"]);
}

export function isValidEnvironment(val: unknown): val is UserPlanInput["environment"] {
  return typeof val === "string" && VALID_ENVIRONMENTS.has(val as UserPlanInput["environment"]);
}

export function isValidIntensity(val: unknown): val is UserPlanInput["intensity"] {
  return typeof val === "string" && VALID_INTENSITIES.has(val as UserPlanInput["intensity"]);
}

export interface RateLimitGuardResult {
  allowed: boolean;
  remaining: number;
  response?: NextResponse;
}

/**
 * Checks per-client request rate limit and constructs a standard 429 response when exceeded.
 */
export function guardRateLimit(
  req: NextRequest,
  maxRequests = 40,
  errorMessage = "Rate limit exceeded. Please wait."
): RateLimitGuardResult {
  const rateLimit = checkRateLimit(req, maxRequests);
  if (!rateLimit.allowed) {
    return {
      allowed: false,
      remaining: 0,
      response: NextResponse.json(
        { error: errorMessage, retryAfter: rateLimit.resetInSeconds },
        {
          status: 429,
          headers: { "Retry-After": rateLimit.resetInSeconds.toString() },
        }
      ),
    };
  }
  return { allowed: true, remaining: rateLimit.remaining };
}

/**
 * Parses and validates geographic coordinates against WGS84 bounds.
 */
export function parseValidCoordinates(
  latRaw: unknown,
  lonRaw: unknown
): { lat: number; lon: number } | null {
  const lat = typeof latRaw === "number" ? latRaw : parseFloat(String(latRaw));
  const lon = typeof lonRaw === "number" ? lonRaw : parseFloat(String(lonRaw));
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }
  return { lat, lon };
}

/**
 * Resolves city metadata either from coordinates or preset hubs, returning an error response
 * when provided coordinates are malformed.
 */
export function resolveTargetCity(options: {
  cityId?: string;
  latParam?: unknown;
  lonParam?: unknown;
  nameParam?: string | null;
  matchPresetThreshold?: number;
}): { city: CityLocation } | { errorResponse: NextResponse } {
  const { cityId = "delhi", latParam, lonParam, nameParam, matchPresetThreshold } = options;

  if (latParam !== undefined && latParam !== null && lonParam !== undefined && lonParam !== null) {
    const coords = parseValidCoordinates(latParam, lonParam);
    if (!coords) {
      return {
        errorResponse: NextResponse.json(
          { error: "Invalid latitude or longitude coordinates." },
          { status: 400 }
        ),
      };
    }

    if (matchPresetThreshold) {
      const matched = PRESET_CITIES.find(
        (c) =>
          Math.abs(c.lat - coords.lat) < matchPresetThreshold &&
          Math.abs(c.lon - coords.lon) < matchPresetThreshold
      );
      if (matched) return { city: matched };
    }

    return {
      city: {
        id: `coord-${coords.lat.toFixed(3)}-${coords.lon.toFixed(3)}`,
        name: nameParam || `Custom Location (${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°)`,
        region: "Custom Region",
        country: "Coordinates",
        lat: coords.lat,
        lon: coords.lon,
        isCustomCoordinates: true,
        isCustomGps: true,
      },
    };
  }

  const found = PRESET_CITIES.find((c) => c.id === cityId);
  return { city: found || PRESET_CITIES[0] };
}

/**
 * Resolves live or pre-supplied atmospheric telemetry for API route handlers.
 */
export async function resolveRouteAirQuality(options: {
  providedAqiData?: unknown;
  cityId?: string;
  latParam?: unknown;
  lonParam?: unknown;
  standard?: AqiStandard | null;
}): Promise<{ aqiData: AirQualityData } | { errorResponse: NextResponse }> {
  const { providedAqiData, cityId, latParam, lonParam, standard } = options;

  if (
    providedAqiData &&
    typeof providedAqiData === "object" &&
    "city" in providedAqiData &&
    providedAqiData.city
  ) {
    return { aqiData: providedAqiData as AirQualityData };
  }

  const cityResult = resolveTargetCity({ cityId, latParam, lonParam });
  if ("errorResponse" in cityResult) {
    return cityResult;
  }

  const validStandard =
    standard === "INDIA_CPCB" || standard === "US_EPA" ? standard : undefined;
  const aqiData = await fetchLiveAirQuality(cityResult.city, validStandard);
  return { aqiData };
}

/**
 * Normalizes and sanitizes untrusted custom activity plan payloads.
 */
export function sanitizePlanInput(rawPlan: Record<string, unknown>): UserPlanInput {
  const env = rawPlan.environment;
  const intensity = rawPlan.intensity;
  const cohort = rawPlan.cohort;

  return {
    activityName: parseStringWithFallback(rawPlan.activityName, "Outdoor Activity", 120),
    plannedTime: parseStringWithFallback(rawPlan.plannedTime, "08:00 AM", 20),
    durationMinutes: parseNumberWithFallback(rawPlan.durationMinutes, 30, 5, 360),
    environment: isValidEnvironment(env) ? env : "outdoor",
    intensity: isValidIntensity(intensity) ? intensity : "moderate",
    cohort: isValidCohort(cohort) ? cohort : "general",
    hasN95Mask: parseBooleanWithFallback(rawPlan.hasN95Mask, false),
  };
}

/**
 * Creates a standardized cached JSON response with rate-limit headers.
 */
export function jsonApiResponse<T>(
  payload: T,
  maxAgeSeconds = 300,
  rateLimitRemaining?: number
): NextResponse {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${Math.min(60, maxAgeSeconds)}`,
  };
  if (typeof rateLimitRemaining === "number") {
    headers["X-RateLimit-Remaining"] = rateLimitRemaining.toString();
  }
  return NextResponse.json(payload, { headers });
}
