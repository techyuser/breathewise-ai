import type { AirQualityData } from "@/types/air-quality";

/**
 * Generates an offline deterministic atmospheric telemetry snapshot so the planner
 * safety verifier can still execute physical dose calculations when live APIs fail.
 */
export function createFallbackAirQualityData(): AirQualityData {
  const nowIso = new Date().toISOString();
  return {
    city: {
      id: "delhi",
      name: "New Delhi",
      region: "Delhi",
      country: "India",
      lat: 28.6139,
      lon: 77.209,
    },
    lastUpdated: nowIso,
    clientFetchTimestamp: nowIso,
    modelRunTimestamp: nowIso,
    camsSource: "CAMS Grid",
    source: "Open-Meteo",
    sourceType: "MODELLED_CAMS_GRID",
    isCpcbGroundStation: false,
    cpcbDisclaimer: "Simulated fallback",
    dataNature: "Demo Data",
    calculationStandard: "India CPCB",
    activeStandard: "INDIA_CPCB",
    referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
    usAqi: 220,
    indiaAqi: 280,
    displayAqi: 280,
    category: "Very Unhealthy",
    indiaCategory: "Very Poor",
    displayCategory: "Very Poor",
    nowCastConcentration: 110,
    isNowCastCalculated: true,
    isDemoData: true,
    europeanAqi: 5,
    primaryPollutant: "PM2.5",
    healthSummary: "High air pollution alert",
    temperature: 22,
    humidity: 60,
    windSpeed: 5,
    weather: {
      code: 0,
      description: "Clear",
      iconName: "Sun",
      temperature: 22,
      feelsLike: 22,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      surfacePressure: 1013,
    },
    pollutants: {
      pm2_5: {
        code: "pm2_5",
        name: "PM2.5",
        chemicalFormula: "PM2.5",
        value: 110,
        unit: "µg/m³",
        whoLimit: 15,
        percentageOfLimit: 733,
        status: "Severe",
        description: "Elevated particulate matter",
      },
    },
    hourlyForecast: [],
    hourlyHistorical: [],
    inversionRisk: {
      level: "High",
      description: "Thermal inversion layer",
      tempInversion: true,
      windSpeed: 5,
      humidity: 60,
      trappedSmogProbability: 75,
    },
    recommendations: {
      general: "Avoid prolonged outdoor exposure.",
      vulnerable: "Stay indoors with HEPA air filtration.",
      outdoorActivity: "Reschedule vigorous workouts to midday or indoors.",
      ventilation: "Keep windows closed during early morning peaks.",
      maskRequired: true,
    },
  };
}
