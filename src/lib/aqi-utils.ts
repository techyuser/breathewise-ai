import { AQICategory } from "@/types/air-quality";

export function getAQICategory(aqi: number | null): AQICategory {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return "Insufficient Data";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAQIColor(aqi: number | null): {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
} {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) {
    return {
      color: "#8496A8",
      bgColor: "rgba(132, 150, 168, 0.08)",
      borderColor: "rgba(132, 150, 168, 0.25)",
      badgeBg: "rgba(132, 150, 168, 0.14)",
    };
  }
  if (aqi <= 50) {
    // Good: #3DDC84
    return {
      color: "#3DDC84",
      bgColor: "rgba(61, 220, 132, 0.10)",
      borderColor: "rgba(61, 220, 132, 0.30)",
      badgeBg: "rgba(61, 220, 132, 0.16)",
    };
  }
  if (aqi <= 100) {
    // Moderate: #FFD23F
    return {
      color: "#FFD23F",
      bgColor: "rgba(255, 210, 63, 0.10)",
      borderColor: "rgba(255, 210, 63, 0.30)",
      badgeBg: "rgba(255, 210, 63, 0.16)",
    };
  }
  if (aqi <= 150) {
    // Unhealthy for Sensitive Groups (Poor): #FF9F45
    return {
      color: "#FF9F45",
      bgColor: "rgba(255, 159, 69, 0.10)",
      borderColor: "rgba(255, 159, 69, 0.30)",
      badgeBg: "rgba(255, 159, 69, 0.16)",
    };
  }
  if (aqi <= 200) {
    // Unhealthy (Very Poor): #FF5C5C
    return {
      color: "#FF5C5C",
      bgColor: "rgba(255, 92, 92, 0.10)",
      borderColor: "rgba(255, 92, 92, 0.30)",
      badgeBg: "rgba(255, 92, 92, 0.16)",
    };
  }
  if (aqi <= 300) {
    // Very Unhealthy (Severe): #C77DFF
    return {
      color: "#C77DFF",
      bgColor: "rgba(199, 125, 255, 0.10)",
      borderColor: "rgba(199, 125, 255, 0.30)",
      badgeBg: "rgba(199, 125, 255, 0.16)",
    };
  }
  // Hazardous (>300): #C77DFF
  return {
    color: "#C77DFF",
    bgColor: "rgba(199, 125, 255, 0.14)",
    borderColor: "rgba(199, 125, 255, 0.40)",
    badgeBg: "rgba(199, 125, 255, 0.20)",
  };
}

/**
 * Mathematically calculates US EPA NowCast PM2.5 AQI from up to 12 hours of preceding concentrations.
 * If data is insufficient, returns demo fallback metadata.
 */
export interface NowCastCalculationResult {
  aqi: number | null;
  nowCastConcentration: number | null;
  isLiveCalculated: boolean;
  isDataSufficient: boolean;
  hoursUsed: number;
  latest3HoursCount: number;
  methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)";
}

/**
 * Calculates US EPA-style PM2.5 NowCast AQI from hourly concentrations.
 *
 * EPA Standard Rules:
 * - Requires at least 2 valid values among the latest 3 clock hours (h = 0, 1, 2).
 * - Applies up to 12-hour decaying weight function sensitive to rapid wildfire and smog spikes.
 * - Preserves original hour offsets when weighting missing observations (uses actual elapsed hour exponent h).
 * - Input source: Copernicus Atmosphere Monitoring Service (CAMS) modelled atmospheric grid.
 *
 * If hourly history does not satisfy the availability rule, returns isDataSufficient: false and null AQI.
 */
export function calculateNowCastAqi(
  hourlyPm25: (number | null | undefined)[],
  currentTimeIndex?: number
): NowCastCalculationResult {
  if (!hourlyPm25 || hourlyPm25.length === 0) {
    return {
      aqi: null,
      nowCastConcentration: null,
      isLiveCalculated: false,
      isDataSufficient: false,
      hoursUsed: 0,
      latest3HoursCount: 0,
      methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
    };
  }

  // Target current index (hour offset h = 0)
  const targetIdx =
    currentTimeIndex !== undefined && currentTimeIndex >= 0
      ? currentTimeIndex
      : hourlyPm25.length - 1;

  // Collect observations up to 12 clock hours preceding: h = 0 (current), h = 1 (t-1), ..., h = 11 (t-11)
  // Preserving the true elapsed hour offset h without compressing gaps
  const observations: { h: number; c: number }[] = [];
  let latest3Count = 0;

  for (let h = 0; h < 12; h++) {
    const idx = targetIdx - h;
    if (idx < 0 || idx >= hourlyPm25.length) continue;

    const rawVal = hourlyPm25[idx];
    if (typeof rawVal === "number" && Number.isFinite(rawVal) && rawVal >= 0) {
      observations.push({ h, c: rawVal });
      if (h < 3) {
        latest3Count++;
      }
    }
  }

  // EPA Availability Rule: At least 2 valid values among the latest 3 clock hours
  if (latest3Count < 2 || observations.length === 0) {
    return {
      aqi: null,
      nowCastConcentration: null,
      isLiveCalculated: false,
      isDataSufficient: false,
      hoursUsed: observations.length,
      latest3HoursCount: latest3Count,
      methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
    };
  }

  const concValues = observations.map((o) => o.c);
  const cMin = Math.min(...concValues);
  const cMax = Math.max(...concValues);

  // Decaying weight factor: w* = cMin / cMax, bounded to [0.5, 1.0]
  const wStar = cMax > 0 ? cMin / cMax : 0.5;
  const w = Math.max(0.5, Math.min(1.0, wStar));

  // Weight each observation by w^h, using the ACTUAL elapsed hour exponent h (NOT compressed index)
  let num = 0;
  let den = 0;
  for (const obs of observations) {
    const weight = Math.pow(w, obs.h);
    num += obs.c * weight;
    den += weight;
  }

  const nowCastC = den > 0 ? num / den : 0;

  // US EPA PM2.5 Breakpoints (C_low, C_high, I_low, I_high)
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];

  if (nowCastC <= 0) {
    return {
      aqi: 0,
      nowCastConcentration: 0.0,
      isLiveCalculated: true,
      isDataSufficient: true,
      hoursUsed: observations.length,
      latest3HoursCount: latest3Count,
      methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
    };
  }

  for (const bp of breakpoints) {
    if (nowCastC <= bp.cHigh) {
      const aqi = Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (nowCastC - bp.cLow) + bp.iLow
      );
      return {
        aqi: Math.min(500, Math.max(0, aqi)),
        nowCastConcentration: Number(nowCastC.toFixed(1)),
        isLiveCalculated: true,
        isDataSufficient: true,
        hoursUsed: observations.length,
        latest3HoursCount: latest3Count,
        methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
      };
    }
  }

  return {
    aqi: 500,
    nowCastConcentration: Number(nowCastC.toFixed(1)),
    isLiveCalculated: true,
    isDataSufficient: true,
    hoursUsed: observations.length,
    latest3HoursCount: latest3Count,
    methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
  };
}

export function getHealthAdvisory(category: AQICategory) {
  switch (category) {
    case "Good":
      return {
        headline: "Air quality is favorable & ideal for outdoor activities",
        general: "Clean atmospheric air. Natural ventilation is encouraged.",
        sensitive: "Low baseline risk for asthma, children, or cardiac patients.",
        action: "Open windows to circulate fresh outdoor air.",
        mask: false,
      };
    case "Moderate":
      return {
        headline: "Acceptable quality; mild sensitivity possible for vulnerable groups",
        general: "Air quality is acceptable. Very sensitive individuals may notice mild respiratory irritation.",
        sensitive: "Consider reducing strenuous outdoor exertion if unusually sensitive.",
        action: "Normal activities permitted; monitor if sensitivity occurs.",
        mask: false,
      };
    case "Unhealthy for Sensitive Groups":
      return {
        headline: "Elevated particulate concentration; sensitive individuals should take precautions",
        general: "General public is less likely to be affected.",
        sensitive: "Children, elderly, and people with respiratory illness should limit prolonged outdoor exertion.",
        action: "Run indoor HEPA purifiers on medium speed.",
        mask: false,
      };
    case "Unhealthy":
      return {
        headline: "Active smog alert. Adverse effects likely for general public",
        general: "Increased likelihood of respiratory symptoms in general population.",
        sensitive: "Avoid outdoor activities. Keep rescue inhalers accessible.",
        action: "Wear N95/FFP2 masks outdoors; seal windows during morning inversion.",
        mask: true,
      };
    case "Very Unhealthy":
      return {
        headline: "Health alert: serious risk of respiratory strain for all",
        general: "Significant smog buildup. Exercise caution and stay indoors where possible.",
        sensitive: "Remain indoors with air purifiers active. Restrict all outdoor activity.",
        action: "Equip N95 respirator if stepping out. Avoid morning rush commute.",
        mask: true,
      };
    case "Hazardous":
      return {
        headline: "Emergency threshold: critical smog & trapped toxic air",
        general: "Entire population is likely to be affected. Atmospheric inversion trapping particulate matter.",
        sensitive: "Remain strictly indoors with active particulate filtration. Avoid all outdoor physical activity.",
        action: "Continuous indoor HEPA filtration. Essential travel only with certified N95+ mask.",
        mask: true,
      };
    case "Insufficient Data":
      return {
        headline: "Insufficient hourly data for EPA NowCast estimate",
        general: "Fewer than 2 valid observations available in the latest 3 clock hours.",
        sensitive: "Exercise caution. Refer to individual pollutant readings.",
        action: "Check recent hourly trends and local guidance.",
        mask: false,
      };
  }
}
