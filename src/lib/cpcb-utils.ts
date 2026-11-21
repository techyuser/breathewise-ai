import { CpcbCategory } from "@/types/air-quality";

export interface CpcbSubIndex {
  pollutant: string;
  subIndex: number;
}

/**
 * Official Indian National Air Quality Index (NAQI) Categories
 * Formulated by the Central Pollution Control Board (CPCB, October 2014)
 */
export function getCpcbCategory(naqi: number): CpcbCategory {
  if (naqi <= 50) return "Good";
  if (naqi <= 100) return "Satisfactory";
  if (naqi <= 200) return "Moderate";
  if (naqi <= 300) return "Poor";
  if (naqi <= 400) return "Very Poor";
  return "Severe";
}

/**
 * Official CPCB Color Coding
 * Dark Green (Good) -> Light Green (Satisfactory) -> Yellow (Moderate) ->
 * Orange (Poor) -> Red (Very Poor) -> Dark Red (Severe)
 */
export function getCpcbColor(naqi: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
} {
  if (naqi <= 50) {
    return {
      color: "#00D69A",
      bgColor: "rgba(0, 214, 154, 0.08)",
      borderColor: "rgba(0, 214, 154, 0.25)",
      badgeBg: "rgba(0, 214, 154, 0.14)",
    };
  }
  if (naqi <= 100) {
    return {
      color: "#84CC16",
      bgColor: "rgba(132, 204, 22, 0.08)",
      borderColor: "rgba(132, 204, 22, 0.25)",
      badgeBg: "rgba(132, 204, 22, 0.14)",
    };
  }
  if (naqi <= 200) {
    return {
      color: "#FACC15",
      bgColor: "rgba(250, 204, 21, 0.08)",
      borderColor: "rgba(250, 204, 21, 0.25)",
      badgeBg: "rgba(250, 204, 21, 0.14)",
    };
  }
  if (naqi <= 300) {
    return {
      color: "#FB923C",
      bgColor: "rgba(251, 146, 60, 0.08)",
      borderColor: "rgba(251, 146, 60, 0.25)",
      badgeBg: "rgba(251, 146, 60, 0.14)",
    };
  }
  if (naqi <= 400) {
    return {
      color: "#F87171",
      bgColor: "rgba(248, 113, 113, 0.08)",
      borderColor: "rgba(248, 113, 113, 0.25)",
      badgeBg: "rgba(248, 113, 113, 0.14)",
    };
  }
  return {
    color: "#E11D48",
    bgColor: "rgba(225, 29, 72, 0.08)",
    borderColor: "rgba(225, 29, 72, 0.3)",
    badgeBg: "rgba(225, 29, 72, 0.16)",
  };
}

/**
 * Official CPCB Health Statements & Medical Advisory (CPCB 2014 Report)
 */
export function getCpcbHealthDirective(naqi: number): {
  headline: string;
  generalPublic: string;
  sensitiveGroups: string;
  maskRecommended: boolean;
} {
  const cat = getCpcbCategory(naqi);

  switch (cat) {
    case "Good":
      return {
        headline: "Minimal Impact — Clean Air",
        generalPublic: "Air quality is favorable. Outdoor exercise and natural ventilation are safe.",
        sensitiveGroups: "No restrictions for sensitive individuals.",
        maskRecommended: false,
      };
    case "Satisfactory":
      return {
        headline: "Minor Discomfort for Sensitive Groups",
        generalPublic: "Air quality is acceptable for most people.",
        sensitiveGroups: "Unusually sensitive individuals with asthma may experience minor breathing discomfort.",
        maskRecommended: false,
      };
    case "Moderate":
      return {
        headline: "Breathing Discomfort for Respiratory Patients",
        generalPublic: "Noticeable haze. Healthy individuals may experience mild throat irritation during long runs.",
        sensitiveGroups: "People with asthma, lung disorders, or heart conditions should avoid prolonged outdoor exertion.",
        maskRecommended: false,
      };
    case "Poor":
      return {
        headline: "Breathing Discomfort for Most People",
        generalPublic: "Prolonged outdoor exposure can cause coughing and respiratory strain.",
        sensitiveGroups: "Children, elderly, and respiratory patients should stay indoors during morning and evening peak smog.",
        maskRecommended: true,
      };
    case "Very Poor":
      return {
        headline: "Respiratory Illness Warning on Prolonged Exposure",
        generalPublic: "Significant respiratory strain. Avoid strenuous outdoor activities and runs.",
        sensitiveGroups: "High risk of exacerbating asthma and cardiopulmonary conditions. Stay in sealed indoor filtered rooms.",
        maskRecommended: true,
      };
    case "Severe":
      return {
        headline: "Severe Health Alert — Serious Respiratory Impact",
        generalPublic: "Even healthy individuals may experience respiratory distress and chest tightness.",
        sensitiveGroups: "High medical hazard. Keep children, elderly, and pregnant women strictly indoors with active filtration.",
        maskRecommended: true,
      };
  }
}

/**
 * Linear interpolation formula from CPCB 2014 guidelines:
 * Ip = [ (I_HI - I_LO) / (B_HI - B_LO) ] * (Cp - B_LO) + I_LO
 */
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

/**
 * Full CPCB 6-Pollutant NAQI Calculator
 *
 * Implements official breakpoints for:
 * 1. PM2.5 (24-hour average in µg/m³)
 * 2. PM10 (24-hour average in µg/m³)
 * 3. NO2 (24-hour average in µg/m³)
 * 4. SO2 (24-hour average in µg/m³)
 * 5. O3 (8-hour average in µg/m³)
 * 6. CO (8-hour average in mg/m³; converted from µg/m³ if needed)
 *
 * Validation Rule (CPCB Standard):
 * NAQI requires at least 3 pollutants to be monitored, of which at least one MUST be PM2.5 or PM10.
 */
export function calculateCpcbNaqi(pollutantValues: {
  pm2_5?: number; // 24h average in µg/m³
  pm10?: number; // 24h average in µg/m³
  nitrogen_dioxide?: number; // 24h average in µg/m³
  sulphur_dioxide?: number; // 24h average in µg/m³
  carbon_monoxide?: number; // 8h average in µg/m³ (will be converted to mg/m³)
  ozone?: number; // 8h average in µg/m³
}): {
  naqi: number;
  dominantPollutant: string;
  subIndices: Record<string, number>;
  pollutantsCount: number;
  hasCoreParticulates: boolean;
} {
  // 1. PM2.5 Breakpoints (24h µg/m³)
  const pm25Breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ];

  // 2. PM10 Breakpoints (24h µg/m³)
  const pm10Breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ];

  // 3. NO2 Breakpoints (24h µg/m³)
  const no2Breakpoints = [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 800, iLow: 401, iHigh: 500 },
  ];

  // 4. SO2 Breakpoints (24h µg/m³)
  const so2Breakpoints = [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2000, iLow: 401, iHigh: 500 },
  ];

  // 5. Ozone O3 Breakpoints (8h µg/m³)
  const o3Breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
  ];

  // 6. Carbon Monoxide CO Breakpoints (8h in mg/m³)
  // CPCB defines CO in mg/m³: 0-1 (Good), 1.1-2 (Satisfactory), 2.1-10 (Moderate), 10.1-17 (Poor), 17.1-34 (Very Poor), >34 (Severe)
  const coBreakpointsMg = [
    { cLow: 0.0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 },
  ];

  const subIndices: Record<string, number> = {};

  if (pollutantValues.pm2_5 !== undefined && !isNaN(pollutantValues.pm2_5)) {
    subIndices["PM2.5"] = calculateLinearSubIndex(pollutantValues.pm2_5, pm25Breakpoints);
  }
  if (pollutantValues.pm10 !== undefined && !isNaN(pollutantValues.pm10)) {
    subIndices["PM10"] = calculateLinearSubIndex(pollutantValues.pm10, pm10Breakpoints);
  }
  if (pollutantValues.nitrogen_dioxide !== undefined && !isNaN(pollutantValues.nitrogen_dioxide)) {
    subIndices["NO₂"] = calculateLinearSubIndex(pollutantValues.nitrogen_dioxide, no2Breakpoints);
  }
  if (pollutantValues.sulphur_dioxide !== undefined && !isNaN(pollutantValues.sulphur_dioxide)) {
    subIndices["SO₂"] = calculateLinearSubIndex(pollutantValues.sulphur_dioxide, so2Breakpoints);
  }
  if (pollutantValues.ozone !== undefined && !isNaN(pollutantValues.ozone)) {
    subIndices["O₃"] = calculateLinearSubIndex(pollutantValues.ozone, o3Breakpoints);
  }
  if (pollutantValues.carbon_monoxide !== undefined && !isNaN(pollutantValues.carbon_monoxide)) {
    // Open-Meteo returns CO in µg/m³. Convert to mg/m³: 1 mg/m³ = 1000 µg/m³
    const coMgM3 = pollutantValues.carbon_monoxide / 1000;
    subIndices["CO"] = calculateLinearSubIndex(coMgM3, coBreakpointsMg);
  }

  const pollutantsCount = Object.keys(subIndices).length;
  const hasCoreParticulates = Boolean(subIndices["PM2.5"] !== undefined || subIndices["PM10"] !== undefined);

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
    pollutantsCount,
    hasCoreParticulates,
  };
}
