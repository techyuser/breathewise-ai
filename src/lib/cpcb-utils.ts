import { CpcbCategory } from "@/types/air-quality";

export interface CpcbSubIndex {
  pollutant: string;
  subIndex: number;
}

export function getCpcbCategory(naqi: number): CpcbCategory {
  if (naqi <= 50) return "Good";
  if (naqi <= 100) return "Satisfactory";
  if (naqi <= 200) return "Moderate";
  if (naqi <= 300) return "Poor";
  if (naqi <= 400) return "Very Poor";
  return "Severe";
}

export function getCpcbColor(naqi: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
} {
  if (naqi <= 50) {
    // Good (Dark Green / Emerald)
    return {
      color: "#00D69A",
      bgColor: "rgba(0, 214, 154, 0.08)",
      borderColor: "rgba(0, 214, 154, 0.25)",
      badgeBg: "rgba(0, 214, 154, 0.14)",
    };
  }
  if (naqi <= 100) {
    // Satisfactory (Light Green)
    return {
      color: "#84CC16",
      bgColor: "rgba(132, 204, 22, 0.08)",
      borderColor: "rgba(132, 204, 22, 0.25)",
      badgeBg: "rgba(132, 204, 22, 0.14)",
    };
  }
  if (naqi <= 200) {
    // Moderate (Yellow)
    return {
      color: "#FACC15",
      bgColor: "rgba(250, 204, 21, 0.08)",
      borderColor: "rgba(250, 204, 21, 0.25)",
      badgeBg: "rgba(250, 204, 21, 0.14)",
    };
  }
  if (naqi <= 300) {
    // Poor (Orange)
    return {
      color: "#FB923C",
      bgColor: "rgba(251, 146, 60, 0.08)",
      borderColor: "rgba(251, 146, 60, 0.25)",
      badgeBg: "rgba(251, 146, 60, 0.14)",
    };
  }
  if (naqi <= 400) {
    // Very Poor (Red)
    return {
      color: "#F87171",
      bgColor: "rgba(248, 113, 113, 0.08)",
      borderColor: "rgba(248, 113, 113, 0.25)",
      badgeBg: "rgba(248, 113, 113, 0.14)",
    };
  }
  // Severe (>400, Dark Red / Maroon)
  return {
    color: "#E11D48",
    bgColor: "rgba(225, 29, 72, 0.08)",
    borderColor: "rgba(225, 29, 72, 0.3)",
    badgeBg: "rgba(225, 29, 72, 0.16)",
  };
}

function calculateLinearSubIndex(
  c: number,
  breakpoints: { cLow: number; cHigh: number; iLow: number; iHigh: number }[]
): number {
  if (c <= 0) return 0;
  for (const bp of breakpoints) {
    if (c <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow
      );
    }
  }
  return 500;
}

export function calculateCpcbNaqi(pollutantValues: {
  pm2_5?: number;
  pm10?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  carbon_monoxide?: number; // µg/m³
  ozone?: number;
}): { naqi: number; dominantPollutant: string; subIndices: Record<string, number> } {
  const pm25Breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ];

  const pm10Breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ];

  const no2Breakpoints = [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 800, iLow: 401, iHigh: 500 },
  ];

  const so2Breakpoints = [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2000, iLow: 401, iHigh: 500 },
  ];

  const subIndices: Record<string, number> = {};

  if (pollutantValues.pm2_5 !== undefined) {
    subIndices["PM2.5"] = calculateLinearSubIndex(pollutantValues.pm2_5, pm25Breakpoints);
  }
  if (pollutantValues.pm10 !== undefined) {
    subIndices["PM10"] = calculateLinearSubIndex(pollutantValues.pm10, pm10Breakpoints);
  }
  if (pollutantValues.nitrogen_dioxide !== undefined) {
    subIndices["NO₂"] = calculateLinearSubIndex(pollutantValues.nitrogen_dioxide, no2Breakpoints);
  }
  if (pollutantValues.sulphur_dioxide !== undefined) {
    subIndices["SO₂"] = calculateLinearSubIndex(pollutantValues.sulphur_dioxide, so2Breakpoints);
  }

  let maxAqi = 0;
  let dominant = "PM2.5";

  for (const [pollutant, val] of Object.entries(subIndices)) {
    if (val > maxAqi) {
      maxAqi = val;
      dominant = pollutant;
    }
  }

  return {
    naqi: Math.max(1, maxAqi),
    dominantPollutant: dominant,
    subIndices,
  };
}
