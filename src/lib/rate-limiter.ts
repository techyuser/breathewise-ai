import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 40; // 40 requests per window

function cleanExpired() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

export function checkRateLimit(
  req: NextRequest,
  limit: number = MAX_REQUESTS
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  cleanExpired();

  // Extract client identifier from standard reverse proxy headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}
