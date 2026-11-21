import { CpcbCategory } from "@/types/air-quality";

export interface CpcbSubIndex {
  pollutant: string;
  subIndex: number;
}

/**
 * Official Indian National Air Quality Index (NAQI) Categories
 * Formulated by the Central Pollution Control Board (CPCB, October 2014)
 */
export function getCpcbCategory(naqi: number | null): CpcbCategory {
  if (naqi === null || !Number.isFinite(naqi) || naqi < 0) return "Insufficient Data";
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
export function getCpcbColor(naqi: number | null): {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
} {
  if (naqi === null || !Number.isFinite(naqi) || naqi < 0) {
    return {
      color: "#98A9A1",
      bgColor: "rgba(152, 169, 161, 0.08)",
      borderColor: "rgba(152, 169, 161, 0.25)",
      badgeBg: "rgba(152, 169, 161, 0.14)",
    };
  }
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
 * Official CPCB Health Statements & Evidence-Aligned Advisory (CPCB 2014 Report)
 */
export function getCpcbHealthDirective(naqi: number | null): {
  headline: string;
  generalPublic: string;
  sensitiveGroups: string;
  maskRecommended: boolean;
} {
  if (naqi === null || !Number.isFinite(naqi) || naqi < 0) {
    return {
      headline: "Insufficient Data for CPCB NAQI",
      generalPublic: "Fewer than 3 criteria pollutants or particulate averages available to compute regulatory NAQI.",
      sensitiveGroups: "Exercise caution. Refer to individual particulate and gas metrics.",
      maskRecommended: false,
    };
  }

  const cat = getCpcbCategory(naqi);

  switch (cat) {
    case "Good":
      return {
        headline: "Minimal Impact — Favorable Air Quality",
        generalPublic: "Air quality is favorable. Outdoor activities and natural ventilation carry low baseline risk.",
        sensitiveGroups: "No restrictions indicated for sensitive individuals.",
        maskRecommended: false,
      };
    case "Satisfactory":
      return {
        headline: "Minor Discomfort for Sensitive Groups",
        generalPublic: "Air quality is acceptable for most people.",
        sensitiveGroups: "Sensitive individuals with respiratory conditions may experience minor breathing discomfort.",
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
        headline: "Breathing Discomfort on Prolonged Exposure",
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
        headline: "Severe Health Alert — High Respiratory Hazard",
        generalPublic: "Even healthy individuals may experience respiratory distress and chest tightness.",
        sensitiveGroups: "High health hazard. Vulnerable individuals (children, elderly, pregnant women, respiratory patients) should remain indoors with active HEPA filtration.",
        maskRecommended: true,
      };
    case "Insufficient Data":
      return {
        headline: "Insufficient Data for CPCB NAQI",
        generalPublic: "Fewer than 3 criteria pollutants or particulate averages available to compute regulatory NAQI.",
        sensitiveGroups: "Exercise caution. Refer to individual particulate metrics.",
        maskRecommended: false,
      };
  }
}

export interface CpcbBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

export const CPCB_BREAKPOINTS: Record<string, CpcbBreakpoint[]> = {
  pm2_5: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  nitrogen_dioxide: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 800, iLow: 401, iHigh: 500 },
  ],
  sulphur_dioxide: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2000, iLow: 401, iHigh: 500 },
  ],
  ozone: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
  carbon_monoxide: [
    { cLow: 0.0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 },
  ],
};

/**
 * Linear interpolation formula from CPCB 2014 guidelines:
 * Ip = [ (I_HI - I_LO) / (B_HI - B_LO) ] * (Cp - B_LO) + I_LO
 */
export function calculateCpcbSubIndex(
  c: number,
  breakpoints: CpcbBreakpoint[]
): number {
  if (!Number.isFinite(c) || c <= 0) return 0;
  for (const bp of breakpoints) {
    if (c <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow
      );
    }
  }
  return 500;
}

export function calculateLinearSubIndex(
  c: number,
  breakpoints: CpcbBreakpoint[]
): number {
  return calculateCpcbSubIndex(c, breakpoints);
}

export interface CpcbCalculationResult {
  naqi: number | null;
  dominantPollutant: string;
  subIndices: Record<string, number>;
  pollutantsCount: number;
  hasCoreParticulates: boolean;
  isDataSufficient: boolean;
  insufficiencyReason?: string;
  isModelDerivedEstimate: boolean;
  standardDisclaimer: string;
}

/**
 * Full CPCB 6-Pollutant NAQI Calculator
 *
 * Implements official breakpoints for:
 * 1. PM2.5 (24-hour average in µg/m³, requires >=16h valid data)
 * 2. PM10 (24-hour average in µg/m³, requires >=16h valid data)
 * 3. NO2 (24-hour average in µg/m³, requires >=16h valid data)
 * 4. SO2 (24-hour average in µg/m³, requires >=16h valid data)
 * 5. O3 (8-hour average in µg/m³, requires >=6h valid data)
 * 6. CO (8-hour average in mg/m³, requires >=6h valid data)
 *
 * Official CPCB Validation Rules (CPCB 2014 Standard):
 * - NAQI requires at least 3 pollutants to be monitored with valid averaging periods.
 * - At least one monitored pollutant MUST be PM2.5 or PM10 (core particulates).
 * - A pollutant 24h sub-index requires at least 16 hourly observations; otherwise it cannot be computed.
 * - Missing concentrations must NEVER be fabricated or assumed.
 * - Rejects negative values, non-finite values (NaN, Infinity).
 * - Never returns a valid-looking NAQI when requirements are unmet.
 */
export function calculateCpcbNaqi(pollutantValues: {
  pm2_5?: number; // 24h average in µg/m³
  pm10?: number; // 24h average in µg/m³
  nitrogen_dioxide?: number; // 24h average in µg/m³
  sulphur_dioxide?: number; // 24h average in µg/m³
  carbon_monoxide?: number; // 8h average in µg/m³ (will be converted to mg/m³)
  ozone?: number; // 8h average in µg/m³
}): CpcbCalculationResult {
  const pm25Breakpoints = CPCB_BREAKPOINTS.pm2_5;
  const pm10Breakpoints = CPCB_BREAKPOINTS.pm10;
  const no2Breakpoints = CPCB_BREAKPOINTS.nitrogen_dioxide;
  const so2Breakpoints = CPCB_BREAKPOINTS.sulphur_dioxide;
  const o3Breakpoints = CPCB_BREAKPOINTS.ozone;
  const coBreakpointsMg = CPCB_BREAKPOINTS.carbon_monoxide;

  function validateConcentration(val: unknown): number | undefined {
    if (typeof val === "number" && Number.isFinite(val) && val >= 0) {
      return val;
    }
    return undefined;
  }

  const validPm25 = validateConcentration(pollutantValues.pm2_5);
  const validPm10 = validateConcentration(pollutantValues.pm10);
  const validNo2 = validateConcentration(pollutantValues.nitrogen_dioxide);
  const validSo2 = validateConcentration(pollutantValues.sulphur_dioxide);
  const validOzone = validateConcentration(pollutantValues.ozone);
  const validCo = validateConcentration(pollutantValues.carbon_monoxide);

  const subIndices: Record<string, number> = {};

  if (validPm25 !== undefined) {
    subIndices["PM2.5"] = calculateLinearSubIndex(validPm25, pm25Breakpoints);
  }
  if (validPm10 !== undefined) {
    subIndices["PM10"] = calculateLinearSubIndex(validPm10, pm10Breakpoints);
  }
  if (validNo2 !== undefined) {
    subIndices["NO₂"] = calculateLinearSubIndex(validNo2, no2Breakpoints);
  }
  if (validSo2 !== undefined) {
    subIndices["SO₂"] = calculateLinearSubIndex(validSo2, so2Breakpoints);
  }
  if (validOzone !== undefined) {
    subIndices["O₃"] = calculateLinearSubIndex(validOzone, o3Breakpoints);
  }
  if (validCo !== undefined) {
    const coMgM3 = validCo / 1000;
    subIndices["CO"] = calculateLinearSubIndex(coMgM3, coBreakpointsMg);
  }

  const pollutantsCount = Object.keys(subIndices).length;
  const hasCoreParticulates = Boolean(subIndices["PM2.5"] !== undefined || subIndices["PM10"] !== undefined);

  let isDataSufficient = true;
  let insufficiencyReason: string | undefined;

  if (pollutantsCount < 3) {
    isDataSufficient = false;
    insufficiencyReason = `CPCB NAQI requires at least 3 monitored pollutants with valid averaging periods (currently ${pollutantsCount}).`;
  } else if (!hasCoreParticulates) {
    isDataSufficient = false;
    insufficiencyReason = "CPCB NAQI requires at least one core particulate indicator (PM2.5 or PM10).";
  }

  let maxAqi = 0;
  let dominant = "None";

  for (const [pollutant, val] of Object.entries(subIndices)) {
    if (val > maxAqi) {
      maxAqi = val;
      dominant = pollutant;
    }
  }

  return {
    naqi: isDataSufficient ? Math.max(1, maxAqi) : null,
    dominantPollutant: isDataSufficient ? dominant : "Insufficient Data",
    subIndices,
    pollutantsCount,
    hasCoreParticulates,
    isDataSufficient,
    insufficiencyReason,
    isModelDerivedEstimate: true,
    standardDisclaimer:
      "CPCB-style 6-pollutant estimate (PM2.5, PM10, NO₂, SO₂, CO, O₃; excluding NH₃ and Lead) derived from ECMWF Copernicus CAMS grid (~45km resolution). Not an official physical ground monitoring station reading.",
  };
}
