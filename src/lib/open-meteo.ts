import type {
  AirQualityData,
  AqiStandard,
  CityLocation,
  HourlyAQIPoint,
  InversionRisk,
  PollutantDetail,
  WeatherCondition,
} from "@/types/air-quality";
import { getAQICategory, getHealthAdvisory, calculateNowCastAqi } from "./aqi-utils";
import { calculateCpcbNaqi, getCpcbCategory, getCpcbHealthDirective } from "./cpcb-utils";
import { parseWmoWeatherCode } from "./weather-codes";
import { PRESET_CITIES, isLocationInIndia } from "./constants/cities";
import { logger } from "./logger";

export { PRESET_CITIES, isLocationInIndia };

interface RawCurrentPollutants {
  pm2_5?: number;
  pm10?: number;
  nitrogen_dioxide?: number;
  ozone?: number;
  carbon_monoxide?: number;
  sulphur_dioxide?: number;
  european_aqi?: number;
  us_aqi?: number;
  time?: string;
}

interface HourlyArrays {
  times: string[];
  pm25: number[];
  pm10: number[];
  no2: number[];
  so2: number[];
  ozone: number[];
  co: number[];
  usAqi: number[];
  weatherTimeMap: Map<string, number>;
  weatherTemp: number[];
  weatherHumid: number[];
}

interface PollutantSpec {
  code: PollutantDetail["code"];
  name: string;
  chemicalFormula: string;
  rawValue: number | undefined;
  fallback: number;
  decimals: number;
  whoLimit: number;
  description: string;
  getStatus: (value: number) => PollutantDetail["status"];
}

/**
 * Computes rolling average adhering to CPCB 2014 data sufficiency guidelines:
 * - 24-hour average requires at least 16 valid hourly observations (>= 67% data capture).
 * - 8-hour average requires at least 6 valid hourly observations (>= 75% data capture).
 */
function computeRollingAverage(
  arr: number[] | undefined,
  endIdx: number,
  hours: number,
  minRequiredHours?: number
): number | undefined {
  if (!arr || arr.length === 0 || endIdx < 0) return undefined;
  const minHours = minRequiredHours ?? (hours >= 24 ? 16 : Math.ceil(hours * 0.75));
  const startIdx = Math.max(0, endIdx - hours + 1);
  const slice = arr
    .slice(startIdx, endIdx + 1)
    .filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (slice.length < minHours) return undefined;
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / slice.length).toFixed(1));
}

function findCurrentHourIndex(hourlyTimes: string[], currentTimeStr: string): number {
  const exactIndex = hourlyTimes.findIndex((t) => t === currentTimeStr);
  if (exactIndex !== -1 || hourlyTimes.length === 0) return exactIndex;

  const nowMs = Date.now();
  let bestDiff = Infinity;
  let bestIdx = -1;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const diff = Math.abs(new Date(hourlyTimes[i]).getTime() - nowMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildPollutantsMap(current: RawCurrentPollutants): Record<string, PollutantDetail> {
  const specs: PollutantSpec[] = [
    {
      code: "pm2_5",
      name: "Fine Particulate Matter",
      chemicalFormula: "PM2.5",
      rawValue: current.pm2_5,
      fallback: 45.2,
      decimals: 1,
      whoLimit: 15,
      description:
        "Microscopic particles (≤2.5 µm) that penetrate deep into lung alveoli and bloodstream.",
      getStatus: (v) =>
        v > 75 ? "Severe" : v > 35 ? "High" : v > 15 ? "Elevated" : "Safe",
    },
    {
      code: "pm10",
      name: "Coarse Particulate Matter",
      chemicalFormula: "PM10",
      rawValue: current.pm10,
      fallback: 78.4,
      decimals: 1,
      whoLimit: 45,
      description:
        "Inhalable dust, pollen, and debris irritating the upper bronchial airways.",
      getStatus: (v) => (v > 150 ? "Severe" : v > 80 ? "High" : "Elevated"),
    },
    {
      code: "nitrogen_dioxide",
      name: "Nitrogen Dioxide",
      chemicalFormula: "NO₂",
      rawValue: current.nitrogen_dioxide,
      fallback: 38.6,
      decimals: 1,
      whoLimit: 25,
      description: "Combustion gas from vehicular exhausts and thermal power generation.",
      getStatus: (v) => (v > 50 ? "High" : "Elevated"),
    },
    {
      code: "ozone",
      name: "Ground-Level Ozone",
      chemicalFormula: "O₃",
      rawValue: current.ozone,
      fallback: 42.1,
      decimals: 1,
      whoLimit: 100,
      description: "Secondary photochemical pollutant formed under sunlight interaction with VOCs.",
      getStatus: (v) => (v > 100 ? "High" : "Safe"),
    },
    {
      code: "carbon_monoxide",
      name: "Carbon Monoxide",
      chemicalFormula: "CO",
      rawValue: current.carbon_monoxide,
      fallback: 460,
      decimals: 0,
      whoLimit: 4000,
      description: "Incomplete combustion gas binding to hemoglobin and lowering tissue oxygenation.",
      getStatus: (v) => (v > 4000 ? "High" : "Safe"),
    },
    {
      code: "sulphur_dioxide",
      name: "Sulphur Dioxide",
      chemicalFormula: "SO₂",
      rawValue: current.sulphur_dioxide,
      fallback: 12.3,
      decimals: 1,
      whoLimit: 40,
      description: "Emissions from industrial coal burning, heavy fuel oil, and refining.",
      getStatus: (v) => (v > 40 ? "High" : "Safe"),
    },
  ];

  const pollutants: Record<string, PollutantDetail> = {};
  for (const spec of specs) {
    const val = spec.rawValue ?? spec.fallback;
    pollutants[spec.code] = {
      code: spec.code,
      name: spec.name,
      chemicalFormula: spec.chemicalFormula,
      value: Number(val.toFixed(spec.decimals)),
      unit: "µg/m³",
      whoLimit: spec.whoLimit,
      percentageOfLimit: Math.round((val / spec.whoLimit) * 100),
      status: spec.getStatus(val),
      description: spec.description,
    };
  }
  return pollutants;
}

function buildHourlySeries(
  arrays: HourlyArrays,
  startIdx: number,
  endIdxInclusive: number,
  isHistorical: boolean,
  fallbackUsAqi: number | null,
  fallbackTemp: number,
  fallbackHumidity: number
): HourlyAQIPoint[] {
  const points: HourlyAQIPoint[] = [];
  const limit = Math.min(endIdxInclusive, arrays.times.length - 1);

  for (let i = startIdx; i <= limit; i++) {
    const time = arrays.times[i];
    const displayTime = new Date(time).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });

    const indiaCalc = calculateCpcbNaqi({
      pm2_5: computeRollingAverage(arrays.pm25, i, 24, 16),
      pm10: computeRollingAverage(arrays.pm10, i, 24, 16),
      nitrogen_dioxide: computeRollingAverage(arrays.no2, i, 24, 16),
      sulphur_dioxide: computeRollingAverage(arrays.so2, i, 24, 16),
      ozone: computeRollingAverage(arrays.ozone, i, 8, 6),
      carbon_monoxide: computeRollingAverage(arrays.co, i, 8, 6),
    });

    const weatherIdx = arrays.weatherTimeMap.get(time);
    const rawUs = arrays.usAqi[i];
    const pm25Val = arrays.pm25[i];
    const pm10Val = arrays.pm10[i];

    points.push({
      time,
      displayTime,
      usAqi: typeof rawUs === "number" && Number.isFinite(rawUs) ? Math.round(rawUs) : fallbackUsAqi,
      indiaAqi: indiaCalc.isDataSufficient ? indiaCalc.naqi : null,
      pm2_5: typeof pm25Val === "number" && Number.isFinite(pm25Val) ? Math.round(pm25Val) : 0,
      pm10: typeof pm10Val === "number" && Number.isFinite(pm10Val) ? Math.round(pm10Val) : 0,
      nitrogen_dioxide: arrays.no2[i] ? Math.round(arrays.no2[i]) : undefined,
      ozone: arrays.ozone[i] ? Math.round(arrays.ozone[i]) : undefined,
      temperature:
        weatherIdx !== undefined
          ? Math.round(arrays.weatherTemp[weatherIdx] ?? fallbackTemp)
          : fallbackTemp,
      humidity:
        weatherIdx !== undefined
          ? Math.round(arrays.weatherHumid[weatherIdx] ?? fallbackHumidity)
          : fallbackHumidity,
      isHistorical,
    });
  }

  return points;
}

function calculateInversionRisk(
  windSpeed: number,
  humidity: number,
  temperature: number,
  displayAqi: number | null
): InversionRisk {
  const isInversionProne = windSpeed < 9 && humidity > 55 && temperature < 22;
  const aqiForInversion = displayAqi ?? 100;
  const trappedSmogProbability = Math.min(
    98,
    Math.max(
      10,
      Math.round(
        (10 - Math.min(windSpeed, 10)) * 4 +
          (humidity / 100) * 35 +
          (aqiForInversion > 150 ? 25 : 10)
      )
    )
  );

  const level: InversionRisk["level"] =
    trappedSmogProbability > 75
      ? "Extreme"
      : trappedSmogProbability > 50
      ? "High"
      : trappedSmogProbability > 30
      ? "Moderate"
      : "Low";

  return {
    level,
    description: isInversionProne
      ? "Atmospheric temperature inversion active. Stagnant ground mist and low wind velocity trap surface smog."
      : "Favorable wind dispersion with active convective vertical air mixing.",
    tempInversion: isInversionProne,
    windSpeed,
    humidity,
    trappedSmogProbability,
  };
}

function getOutdoorGuidance(
  isCpcbStandard: boolean,
  finalIndiaAqi: number | null,
  displayAqi: number | null
): string {
  if (isCpcbStandard) {
    if (finalIndiaAqi === null) {
      return "Insufficient pollutant observations to establish full CPCB NAQI advisory.";
    }
    if (finalIndiaAqi > 300) {
      return "Hazardous air. Strictly avoid outdoor exercise and heavy physical exertion.";
    }
    if (finalIndiaAqi > 200) {
      return "Poor air quality. Avoid prolonged outdoor morning and evening exertion.";
    }
    if (finalIndiaAqi > 100) {
      return "Moderate air. Sensitive groups should take frequent breaks during outdoor activities.";
    }
    return "Air quality is favorable for all regular outdoor activities.";
  }

  if (displayAqi === null) return "Insufficient hourly data to establish NowCast advisory.";
  if (displayAqi > 180) return "Avoid all strenuous outdoor exertion. Shift workouts indoors.";
  if (displayAqi > 100) return "Limit morning and late evening outdoor runs.";
  return "Outdoor conditions favorable for moderate exercise.";
}

function getVentilationGuidance(
  isCpcbStandard: boolean,
  finalIndiaAqi: number | null,
  displayAqi: number | null
): string {
  if (isCpcbStandard) {
    if (finalIndiaAqi === null) {
      return "Keep windows closed during morning/evening inversion hours as a precaution.";
    }
    if (finalIndiaAqi > 200) {
      return "Keep windows sealed. Use internal certified HEPA recirculating air filtration.";
    }
    if (finalIndiaAqi > 100) {
      return "Keep windows latched during morning inversion; brief midday airing only if outdoor PM2.5 is low.";
    }
    return "Natural cross-ventilation permitted.";
  }

  if (displayAqi === null) return "Ventilate cautiously during midday only.";
  if (displayAqi > 150) {
    return "Keep windows sealed. Use internal certified HEPA recirculating air filtration.";
  }
  return "Brief midday window airing permitted when solar convection peaks.";
}

/**
 * Fetches live atmospheric telemetry and weather data from Open-Meteo Copernicus CAMS
 * and computes US EPA NowCast + India CPCB NAQI indices.
 */
export async function fetchLiveAirQuality(
  city: CityLocation = PRESET_CITIES[0],
  forcedStandard?: AqiStandard
): Promise<AirQualityData> {
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi&timezone=auto&past_days=1&forecast_days=2`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,apparent_temperature,surface_pressure&hourly=temperature_2m,relative_humidity_2m&timezone=auto&past_days=1&forecast_days=2`;

  const clientFetchTimestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  try {
    const [aqiRes, weatherRes] = await Promise.all([
      fetch(aqUrl, { next: { revalidate: 300 } }),
      fetch(weatherUrl, { next: { revalidate: 300 } }),
    ]);

    if (!aqiRes.ok) {
      throw new Error(`Open-Meteo Air Quality HTTP ${aqiRes.status}`);
    }

    const aqiJson = await aqiRes.json();
    const weatherJson = weatherRes.ok ? await weatherRes.json() : null;
    const current: RawCurrentPollutants = aqiJson.current || {};
    const weatherCurrent = weatherJson?.current || {};

    const hourlyTimes: string[] = aqiJson.hourly?.time || [];
    const weatherHourlyTimes: string[] = weatherJson?.hourly?.time || [];
    const weatherTimeMap = new Map<string, number>();
    weatherHourlyTimes.forEach((wt, idx) => weatherTimeMap.set(wt, idx));

    const arrays: HourlyArrays = {
      times: hourlyTimes,
      pm25: aqiJson.hourly?.pm2_5 || [],
      pm10: aqiJson.hourly?.pm10 || [],
      no2: aqiJson.hourly?.nitrogen_dioxide || [],
      so2: aqiJson.hourly?.sulphur_dioxide || [],
      ozone: aqiJson.hourly?.ozone || [],
      co: aqiJson.hourly?.carbon_monoxide || [],
      usAqi: aqiJson.hourly?.us_aqi || [],
      weatherTimeMap,
      weatherTemp: weatherJson?.hourly?.temperature_2m || [],
      weatherHumid: weatherJson?.hourly?.relative_humidity_2m || [],
    };

    const currentTimeStr = current.time || "";
    const currentIndex = findCurrentHourIndex(hourlyTimes, currentTimeStr);
    const isLive = Boolean(current.pm2_5 !== undefined && arrays.pm25.length > 0);

    const nowCastResult = calculateNowCastAqi(
      arrays.pm25,
      currentIndex >= 0 ? currentIndex : undefined
    );
    const finalUsAqi = nowCastResult.isDataSufficient
      ? nowCastResult.aqi
      : typeof current.us_aqi === "number" && Number.isFinite(current.us_aqi)
      ? Math.round(current.us_aqi)
      : null;

    const cpcbResult = calculateCpcbNaqi({
      pm2_5: computeRollingAverage(arrays.pm25, currentIndex, 24, 16),
      pm10: computeRollingAverage(arrays.pm10, currentIndex, 24, 16),
      nitrogen_dioxide: computeRollingAverage(arrays.no2, currentIndex, 24, 16),
      sulphur_dioxide: computeRollingAverage(arrays.so2, currentIndex, 24, 16),
      ozone: computeRollingAverage(arrays.ozone, currentIndex, 8, 6),
      carbon_monoxide: computeRollingAverage(arrays.co, currentIndex, 8, 6),
    });

    const usCategory = getAQICategory(finalUsAqi);
    const advisory = getHealthAdvisory(usCategory);
    const finalIndiaAqi = cpcbResult.naqi;
    const indiaCategory = getCpcbCategory(finalIndiaAqi);
    const cpcbDirective = getCpcbHealthDirective(finalIndiaAqi);

    const inIndia = isLocationInIndia(city.lat, city.lon, city.country);
    const activeStandard: AqiStandard = forcedStandard || (inIndia ? "INDIA_CPCB" : "US_EPA");
    const isCpcbStandard = activeStandard === "INDIA_CPCB";
    const displayAqi = isCpcbStandard ? finalIndiaAqi : finalUsAqi;

    const temperature = Math.round(weatherCurrent.temperature_2m ?? 18);
    const humidity = Math.round(weatherCurrent.relative_humidity_2m ?? 65);
    const windSpeed = Math.round(weatherCurrent.wind_speed_10m ?? 6);
    const weatherCode = weatherCurrent.weather_code ?? 0;
    const weatherMeta = parseWmoWeatherCode(weatherCode);

    const weatherCondition: WeatherCondition = {
      code: weatherCode,
      description: weatherMeta.description,
      iconName: weatherMeta.iconName,
      temperature,
      feelsLike: Math.round(weatherCurrent.apparent_temperature ?? temperature),
      humidity,
      windSpeed,
      windDirection: Math.round(weatherCurrent.wind_direction_10m ?? 180),
      surfacePressure: Math.round(weatherCurrent.surface_pressure ?? 1013),
    };

    const validCurrentIdx = currentIndex >= 0 ? currentIndex : 24;
    const histStart = Math.max(0, validCurrentIdx - 24);
    const forecastEnd = Math.min(hourlyTimes.length - 1, validCurrentIdx + 47);

    return {
      city: { ...city, isIndianCity: inIndia },
      lastUpdated: clientFetchTimestamp,
      clientFetchTimestamp,
      modelRunTimestamp: currentTimeStr
        ? `${currentTimeStr.replace("T", " ")} (${aqiJson.timezone_abbreviation || "Local"})`
        : "Latest Available Model Cycle",
      camsSource: "Copernicus Atmosphere Monitoring Service (ECMWF CAMS ~45km Grid)",
      source: "Open-Meteo Copernicus CAMS Model Grid (~45km Spatial Resolution)",
      sourceType: "MODELLED_CAMS_GRID",
      isCpcbGroundStation: false,
      cpcbDisclaimer: inIndia
        ? "Model-derived CPCB-style estimate based on ECMWF Copernicus CAMS numerical atmospheric grid (~45km spatial resolution). Not an official physical CPCB ground monitoring station reading."
        : "Copernicus CAMS atmospheric numerical grid simulation (~45km resolution).",
      dataNature: isLive ? "Latest Modelled Air-Quality Data (CAMS Grid)" : "Demo Data",
      calculationStandard: isCpcbStandard
        ? "CPCB-Style NAQI Estimate (CAMS Grid Input)"
        : "EPA-Style PM2.5 NowCast Estimate (CAMS Grid Input)",
      activeStandard,
      referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
      usAqi: finalUsAqi,
      indiaAqi: finalIndiaAqi,
      isCpcbDataSufficient: cpcbResult.isDataSufficient,
      cpcbInsufficiencyReason: cpcbResult.insufficiencyReason,
      isNowCastDataSufficient: nowCastResult.isDataSufficient,
      displayAqi,
      category: usCategory,
      indiaCategory,
      displayCategory: isCpcbStandard ? indiaCategory : usCategory,
      nowCastConcentration: nowCastResult.nowCastConcentration,
      isNowCastCalculated: isLive,
      isDemoData: !isLive,
      europeanAqi: Math.round(current.european_aqi ?? 50),
      primaryPollutant: isCpcbStandard ? cpcbResult.dominantPollutant : "PM2.5",
      healthSummary: isCpcbStandard ? cpcbDirective.headline : advisory.headline,
      temperature,
      humidity,
      windSpeed,
      weather: weatherCondition,
      pollutants: buildPollutantsMap(current),
      hourlyHistorical: buildHourlySeries(
        arrays,
        histStart,
        validCurrentIdx,
        true,
        finalUsAqi,
        temperature,
        humidity
      ),
      hourlyForecast: buildHourlySeries(
        arrays,
        validCurrentIdx,
        forecastEnd,
        false,
        finalUsAqi,
        temperature,
        humidity
      ),
      inversionRisk: calculateInversionRisk(windSpeed, humidity, temperature, displayAqi),
      recommendations: {
        general: isCpcbStandard ? cpcbDirective.generalPublic : advisory.general,
        vulnerable: isCpcbStandard ? cpcbDirective.sensitiveGroups : advisory.sensitive,
        outdoorActivity: getOutdoorGuidance(isCpcbStandard, finalIndiaAqi, displayAqi),
        ventilation: getVentilationGuidance(isCpcbStandard, finalIndiaAqi, displayAqi),
        maskRequired: isCpcbStandard ? cpcbDirective.maskRecommended : advisory.mask,
      },
    };
  } catch (err) {
    logger.error("OpenMeteo", err);
    throw err;
  }
}
