/**
 * Air Quality Data Models & Regulatory Standard Type Definitions.
 * Implements schemas for both India CPCB NAQI and US EPA NowCast compliance.
 */

/**
 * Categorical health risk classification under the US EPA Air Quality Index scale.
 */
export type AQICategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous"
  | "Insufficient Data";

/**
 * Official Indian National Air Quality Index (NAQI) classification defined by CPCB (2014).
 */
export type CpcbCategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe"
  | "Insufficient Data";

/**
 * Regulatory air quality standard algorithm selector.
 */
export type AqiStandard = "US_EPA" | "INDIA_CPCB";

/**
 * Detailed telemetry and health benchmark comparison for an individual atmospheric pollutant.
 */
export interface PollutantDetail {
  code: "pm2_5" | "pm10" | "nitrogen_dioxide" | "ozone" | "carbon_monoxide" | "sulphur_dioxide";
  name: string;
  chemicalFormula: string;
  value: number;
  unit: string;
  whoLimit: number;
  percentageOfLimit: number;
  status: "Safe" | "Elevated" | "High" | "Severe";
  description: string;
}

/**
 * Hourly atmospheric data point for temporal time series and trend projections.
 */
export interface HourlyAQIPoint {
  time: string;
  displayTime: string;
  usAqi: number | null;
  indiaAqi?: number | null;
  pm2_5: number;
  pm10: number;
  nitrogen_dioxide?: number;
  ozone?: number;
  temperature?: number;
  humidity?: number;
  isHistorical?: boolean;
}

/**
 * Geographic location coordinates and regional metadata.
 */
export interface CityLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  isSmogHotspot?: boolean;
  isCustomGps?: boolean;
  isCustomCoordinates?: boolean;
  isIndianCity?: boolean;
}

/**
 * Nocturnal boundary layer thermal inversion risk profile.
 */
export interface InversionRisk {
  level: "Low" | "Moderate" | "High" | "Extreme";
  description: string;
  tempInversion: boolean;
  windSpeed: number; // km/h
  humidity: number; // %
  trappedSmogProbability: number; // 0 - 100%
}

/**
 * Surface meteorological and barometric weather parameters.
 */
export interface WeatherCondition {
  code: number;
  description: string;
  iconName: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  surfacePressure: number;
}

/**
 * Comprehensive atmospheric telemetry snapshot synthesized from CAMS and weather models.
 */
export interface AirQualityData {
  city: CityLocation;
  lastUpdated: string;
  clientFetchTimestamp: string;
  modelRunTimestamp: string;
  camsSource: string;
  source: string;
  sourceType: "MODELLED_CAMS_GRID" | "CPCB_STATION_GROUND";
  isCpcbGroundStation: boolean;
  cpcbDisclaimer: string;
  dataNature: "Latest Modelled Air-Quality Data (CAMS Grid)" | "Live Modelled Forecast (CAMS Grid)" | "CPCB Ground Monitoring Station" | "Demo Data";
  calculationStandard: string;
  activeStandard: AqiStandard;
  referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)";
  usAqi: number | null;
  indiaAqi: number | null;
  isCpcbDataSufficient?: boolean;
  cpcbInsufficiencyReason?: string;
  isNowCastDataSufficient?: boolean;
  nowCastHoursUsed?: number;
  displayAqi: number | null;
  category: AQICategory;
  indiaCategory: CpcbCategory;
  displayCategory: string;
  nowCastConcentration: number | null;
  isNowCastCalculated: boolean;
  isDemoData: boolean;
  europeanAqi: number;
  primaryPollutant: string;
  healthSummary: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weather: WeatherCondition;
  pollutants: Record<string, PollutantDetail>;
  hourlyForecast: HourlyAQIPoint[];
  hourlyHistorical: HourlyAQIPoint[];
  inversionRisk: InversionRisk;
  recommendations: {
    general: string;
    vulnerable: string;
    outdoorActivity: string;
    ventilation: string;
    maskRequired: boolean;
  };
  cacheStatus?: "HIT" | "MISS";
}
