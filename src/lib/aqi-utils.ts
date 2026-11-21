import { AQICategory } from "@/types/air-quality";

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAQIColor(aqi: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
} {
  if (aqi <= 50) {
    return {
      color: "#00D69A", // Emerald
      bgColor: "rgba(0, 214, 154, 0.08)",
      borderColor: "rgba(0, 214, 154, 0.25)",
      badgeBg: "rgba(0, 214, 154, 0.12)",
    };
  }
  if (aqi <= 100) {
    return {
      color: "#FACC15", // Warm Gold
      bgColor: "rgba(250, 204, 21, 0.08)",
      borderColor: "rgba(250, 204, 21, 0.25)",
      badgeBg: "rgba(250, 204, 21, 0.12)",
    };
  }
  if (aqi <= 150) {
    return {
      color: "#FB923C", // Tangerine / Warm Amber
      bgColor: "rgba(251, 146, 60, 0.08)",
      borderColor: "rgba(251, 146, 60, 0.25)",
      badgeBg: "rgba(251, 146, 60, 0.12)",
    };
  }
  if (aqi <= 200) {
    return {
      color: "#F87171", // Coral Red
      bgColor: "rgba(248, 113, 113, 0.08)",
      borderColor: "rgba(248, 113, 113, 0.25)",
      badgeBg: "rgba(248, 113, 113, 0.12)",
    };
  }
  if (aqi <= 300) {
    // Very Unhealthy: Atmospheric muted amethyst, consistent with dark forest green
    return {
      color: "#D8B4FE",
      bgColor: "rgba(216, 180, 254, 0.08)",
      borderColor: "rgba(216, 180, 254, 0.22)",
      badgeBg: "rgba(216, 180, 254, 0.12)",
    };
  }
  // Hazardous (>300): Refined Rose Carmine
  return {
    color: "#FB7185",
    bgColor: "rgba(251, 113, 133, 0.08)",
    borderColor: "rgba(251, 113, 133, 0.25)",
    badgeBg: "rgba(251, 113, 133, 0.12)",
  };
}

/**
 * Mathematically calculates US EPA NowCast PM2.5 AQI from up to 12 hours of preceding concentrations.
 * If data is insufficient, returns demo fallback metadata.
 */
export interface NowCastCalculationResult {
  aqi: number;
  nowCastConcentration: number;
  isLiveCalculated: boolean;
  isDataSufficient: boolean;
  hoursUsed: number;
  methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)";
}

/**
 * Calculates US EPA-style PM2.5 NowCast AQI from hourly concentrations.
 *
 * EPA Standard Rules:
 * - Requires at least 2 consecutive hours of valid hourly PM2.5 data (up to 12 hours max).
 * - Applies 12-hour decaying weight function sensitive to rapid wildfire and smog spikes.
 * - Input source: Copernicus Atmosphere Monitoring Service (CAMS) modelled atmospheric grid.
 *
 * If hourly history < 2 hours, flags isDataSufficient: false.
 */
export function calculateNowCastAqi(
  hourlyPm25: number[],
  currentTimeIndex?: number
): NowCastCalculationResult {
  if (!hourlyPm25 || hourlyPm25.length === 0) {
    return {
      aqi: 125,
      nowCastConcentration: 45.2,
      isLiveCalculated: false,
      isDataSufficient: false,
      hoursUsed: 0,
      methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
    };
  }

  const endIndex =
    currentTimeIndex !== undefined && currentTimeIndex >= 0
      ? currentTimeIndex + 1
      : hourlyPm25.length;
  const startIndex = Math.max(0, endIndex - 12);
  const slice = hourlyPm25
    .slice(startIndex, endIndex)
    .filter((v) => v !== null && v !== undefined && !isNaN(v));

  if (slice.length < 2) {
    const singleVal = slice[0] ?? 45.2;
    return {
      aqi: Math.min(500, Math.round(singleVal * 2.5)),
      nowCastConcentration: Number(singleVal.toFixed(1)),
      isLiveCalculated: false,
      isDataSufficient: false,
      hoursUsed: slice.length,
      methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
    };
  }

  // Reverse so index 0 is the most recent hour (t), index 1 is t-1, etc.
  const recent = [...slice].reverse();
  const cMin = Math.min(...recent);
  const cMax = Math.max(...recent);

  const wStar = cMax > 0 ? cMin / cMax : 0.5;
  const w = Math.max(0.5, wStar);

  let num = 0;
  let den = 0;
  for (let i = 0; i < recent.length; i++) {
    const weight = Math.pow(w, i);
    num += recent[i] * weight;
    den += weight;
  }

  const nowCastC = den > 0 ? num / den : recent[0];

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

  for (const bp of breakpoints) {
    if (nowCastC <= bp.cHigh) {
      const aqi = Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (nowCastC - bp.cLow) + bp.iLow
      );
      return {
        aqi,
        nowCastConcentration: Number(nowCastC.toFixed(1)),
        isLiveCalculated: true,
        isDataSufficient: true,
        hoursUsed: slice.length,
        methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
      };
    }
  }

  return {
    aqi: 500,
    nowCastConcentration: Number(nowCastC.toFixed(1)),
    isLiveCalculated: true,
    isDataSufficient: true,
    hoursUsed: slice.length,
    methodology: "EPA-style PM2.5 NowCast estimate (CAMS model input)",
  };
}

export function getHealthAdvisory(category: AQICategory) {
  switch (category) {
    case "Good":
      return {
        headline: "Air quality is pristine & ideal for all outdoor activities",
        general: "Clean atmospheric air. Natural ventilation is encouraged.",
        sensitive: "Zero risk for asthma, children, or cardiac patients.",
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
        general: "Entire population is likely to be severely affected. Atmospheric inversion trapping particulate matter.",
        sensitive: "Strict medical quarantine from outdoor air advised.",
        action: "Continuous indoor HEPA filtration. Essential travel only with certified N95+ mask.",
        mask: true,
      };
  }
}
