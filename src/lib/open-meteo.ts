import {
  AirQualityData,
  CityLocation,
  HourlyAQIPoint,
  PollutantDetail,
  WeatherCondition,
  AqiStandard,
} from "@/types/air-quality";
import { getAQICategory, getHealthAdvisory, calculateNowCastAqi } from "./aqi-utils";
import { calculateCpcbNaqi, getCpcbCategory } from "./cpcb-utils";
import { parseWmoWeatherCode } from "./weather-codes";

export const PRESET_CITIES: CityLocation[] = [
  {
    id: "delhi",
    name: "New Delhi",
    region: "National Capital Region",
    country: "India",
    lat: 28.6139,
    lon: 77.209,
    isSmogHotspot: true,
    isIndianCity: true,
  },
  {
    id: "mumbai",
    name: "Mumbai",
    region: "Maharashtra",
    country: "India",
    lat: 19.076,
    lon: 72.8777,
    isIndianCity: true,
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    region: "Karnataka",
    country: "India",
    lat: 12.9716,
    lon: 77.5946,
    isIndianCity: true,
  },
  {
    id: "kolkata",
    name: "Kolkata",
    region: "West Bengal",
    country: "India",
    lat: 22.5726,
    lon: 88.3639,
    isSmogHotspot: true,
    isIndianCity: true,
  },
  {
    id: "lahore",
    name: "Lahore",
    region: "Punjab",
    country: "Pakistan",
    lat: 31.5497,
    lon: 74.3436,
    isSmogHotspot: true,
  },
  {
    id: "beijing",
    name: "Beijing",
    region: "Jingjinji",
    country: "China",
    lat: 39.9042,
    lon: 116.4074,
    isSmogHotspot: true,
  },
  {
    id: "milan",
    name: "Milan",
    region: "Po Valley",
    country: "Italy",
    lat: 45.4642,
    lon: 9.19,
    isSmogHotspot: true,
  },
  {
    id: "london",
    name: "London",
    region: "Greater London",
    country: "United Kingdom",
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    id: "new-york",
    name: "New York",
    region: "NY",
    country: "United States",
    lat: 40.7128,
    lon: -74.006,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    region: "Kanto",
    country: "Japan",
    lat: 35.6762,
    lon: 139.6503,
  },
];

export function isLocationInIndia(lat: number, lon: number, country?: string): boolean {
  if (country && country.toLowerCase().includes("india")) return true;
  return lat >= 8.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
}

export async function fetchLiveAirQuality(
  city: CityLocation = PRESET_CITIES[0],
  forcedStandard?: AqiStandard
): Promise<AirQualityData> {
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,us_aqi&timezone=auto&past_days=1&forecast_days=2`;
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

    const current = aqiJson.current || {};
    const weatherCurrent = weatherJson?.current || {};

    const hourlyTimes: string[] = aqiJson.hourly?.time || [];
    const hourlyPm25: number[] = aqiJson.hourly?.pm2_5 || [];
    const hourlyPm10: number[] = aqiJson.hourly?.pm10 || [];
    const hourlyNo2: number[] = aqiJson.hourly?.nitrogen_dioxide || [];
    const hourlyOzone: number[] = aqiJson.hourly?.ozone || [];
    const hourlyUsAqi: number[] = aqiJson.hourly?.us_aqi || [];

    const weatherHourlyTimes: string[] = weatherJson?.hourly?.time || [];
    const weatherHourlyTemp: number[] = weatherJson?.hourly?.temperature_2m || [];
    const weatherHourlyHumid: number[] = weatherJson?.hourly?.relative_humidity_2m || [];

    const currentTimeStr: string = current.time || "";
    let currentIndex = hourlyTimes.findIndex((t) => t === currentTimeStr);
    if (currentIndex === -1 && hourlyTimes.length > 0) {
      // Find closest time point
      const nowMs = Date.now();
      let bestDiff = Infinity;
      hourlyTimes.forEach((t, i) => {
        const diff = Math.abs(new Date(t).getTime() - nowMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          currentIndex = i;
        }
      });
    }

    // Calculate US EPA NowCast from live hourly PM2.5 readings
    const isHourlyAvailable = hourlyPm25.length > 0;
    const nowCastResult = calculateNowCastAqi(
      hourlyPm25,
      currentIndex >= 0 ? currentIndex : undefined
    );

    const isLive = Boolean(current.pm2_5 !== undefined && isHourlyAvailable);
    const finalUsAqi = isLive ? nowCastResult.aqi : Math.round(current.us_aqi ?? 125);
    const usCategory = getAQICategory(finalUsAqi);
    const advisory = getHealthAdvisory(usCategory);

    // Calculate India CPCB NAQI (Central Pollution Control Board)
    const cpcbResult = calculateCpcbNaqi({
      pm2_5: current.pm2_5 ?? 45,
      pm10: current.pm10 ?? 75,
      nitrogen_dioxide: current.nitrogen_dioxide,
      sulphur_dioxide: current.sulphur_dioxide,
      carbon_monoxide: current.carbon_monoxide,
      ozone: current.ozone,
    });
    const finalIndiaAqi = cpcbResult.naqi;
    const indiaCategory = getCpcbCategory(finalIndiaAqi);

    const inIndia = isLocationInIndia(city.lat, city.lon, city.country);
    const activeStandard: AqiStandard =
      forcedStandard || (inIndia ? "INDIA_CPCB" : "US_EPA");

    const displayAqi = activeStandard === "INDIA_CPCB" ? finalIndiaAqi : finalUsAqi;
    const displayCategory =
      activeStandard === "INDIA_CPCB" ? indiaCategory : usCategory;

    // Weather Metrics
    const temperature = Math.round(weatherCurrent.temperature_2m ?? 18);
    const feelsLike = Math.round(weatherCurrent.apparent_temperature ?? temperature);
    const humidity = Math.round(weatherCurrent.relative_humidity_2m ?? 65);
    const windSpeed = Math.round(weatherCurrent.wind_speed_10m ?? 6);
    const windDirection = Math.round(weatherCurrent.wind_direction_10m ?? 180);
    const surfacePressure = Math.round(weatherCurrent.surface_pressure ?? 1013);
    const weatherCode = weatherCurrent.weather_code ?? 0;
    const weatherMeta = parseWmoWeatherCode(weatherCode);

    const weatherCondition: WeatherCondition = {
      code: weatherCode,
      description: weatherMeta.description,
      iconName: weatherMeta.iconName,
      temperature,
      feelsLike,
      humidity,
      windSpeed,
      windDirection,
      surfacePressure,
    };

    // Diurnal atmospheric inversion estimation
    const isInversionProne = windSpeed < 9 && humidity > 55 && temperature < 22;
    const trappedSmogProbability = Math.min(
      98,
      Math.max(
        10,
        Math.round(
          (10 - Math.min(windSpeed, 10)) * 4 +
            (humidity / 100) * 35 +
            (displayAqi > 150 ? 25 : 10)
        )
      )
    );

    const inversionLevel =
      trappedSmogProbability > 75
        ? "Extreme"
        : trappedSmogProbability > 50
        ? "High"
        : trappedSmogProbability > 30
        ? "Moderate"
        : "Low";

    const modelRunTimeFormatted = currentTimeStr
      ? `${currentTimeStr.replace("T", " ")} (${aqiJson.timezone_abbreviation || "Local"})`
      : "Latest Available Model Cycle";

    const pollutants: Record<string, PollutantDetail> = {
      pm2_5: {
        code: "pm2_5",
        name: "Fine Particulate Matter",
        chemicalFormula: "PM2.5",
        value: Number((current.pm2_5 ?? 45.2).toFixed(1)),
        unit: "µg/m³",
        whoLimit: 15,
        percentageOfLimit: Math.round(((current.pm2_5 ?? 45.2) / 15) * 100),
        status:
          (current.pm2_5 ?? 45) > 75
            ? "Severe"
            : (current.pm2_5 ?? 45) > 35
            ? "High"
            : (current.pm2_5 ?? 45) > 15
            ? "Elevated"
            : "Safe",
        description:
          "Microscopic particles (≤2.5 µm) that penetrate deep into lung alveoli and bloodstream.",
      },
      pm10: {
        code: "pm10",
        name: "Coarse Particulate Matter",
        chemicalFormula: "PM10",
        value: Number((current.pm10 ?? 78.4).toFixed(1)),
        unit: "µg/m³",
        whoLimit: 45,
        percentageOfLimit: Math.round(((current.pm10 ?? 78.4) / 45) * 100),
        status:
          (current.pm10 ?? 78) > 150
            ? "Severe"
            : (current.pm10 ?? 78) > 80
            ? "High"
            : "Elevated",
        description:
          "Inhalable dust, pollen, and debris irritating the upper bronchial airways.",
      },
      nitrogen_dioxide: {
        code: "nitrogen_dioxide",
        name: "Nitrogen Dioxide",
        chemicalFormula: "NO₂",
        value: Number((current.nitrogen_dioxide ?? 38.6).toFixed(1)),
        unit: "µg/m³",
        whoLimit: 25,
        percentageOfLimit: Math.round(((current.nitrogen_dioxide ?? 38.6) / 25) * 100),
        status: (current.nitrogen_dioxide ?? 38) > 50 ? "High" : "Elevated",
        description:
          "Combustion gas from vehicular exhausts and thermal power generation.",
      },
      ozone: {
        code: "ozone",
        name: "Ground-Level Ozone",
        chemicalFormula: "O₃",
        value: Number((current.ozone ?? 42.1).toFixed(1)),
        unit: "µg/m³",
        whoLimit: 100,
        percentageOfLimit: Math.round(((current.ozone ?? 42.1) / 100) * 100),
        status: (current.ozone ?? 42) > 100 ? "High" : "Safe",
        description:
          "Secondary photochemical pollutant formed under sunlight interaction with VOCs.",
      },
      carbon_monoxide: {
        code: "carbon_monoxide",
        name: "Carbon Monoxide",
        chemicalFormula: "CO",
        value: Number((current.carbon_monoxide ?? 460).toFixed(0)),
        unit: "µg/m³",
        whoLimit: 4000,
        percentageOfLimit: Math.round(((current.carbon_monoxide ?? 460) / 4000) * 100),
        status: (current.carbon_monoxide ?? 460) > 4000 ? "High" : "Safe",
        description:
          "Incomplete combustion gas binding to hemoglobin and lowering tissue oxygenation.",
      },
      sulphur_dioxide: {
        code: "sulphur_dioxide",
        name: "Sulphur Dioxide",
        chemicalFormula: "SO₂",
        value: Number((current.sulphur_dioxide ?? 12.3).toFixed(1)),
        unit: "µg/m³",
        whoLimit: 40,
        percentageOfLimit: Math.round(((current.sulphur_dioxide ?? 12.3) / 40) * 100),
        status: (current.sulphur_dioxide ?? 12) > 40 ? "High" : "Safe",
        description:
          "Emissions from industrial coal burning, heavy fuel oil, and refining.",
      },
    };

    // Separate Historical (past 24 points) and Forecast (future points)
    const validCurrentIdx = currentIndex >= 0 ? currentIndex : 24;
    
    // Historical points: up to current index (usually 24 hours back)
    const histStart = Math.max(0, validCurrentIdx - 24);
    const hourlyHistorical: HourlyAQIPoint[] = [];
    for (let i = histStart; i <= validCurrentIdx && i < hourlyTimes.length; i++) {
      const t = hourlyTimes[i];
      const d = new Date(t);
      const displayTime = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      const pm25Val = hourlyPm25[i] ?? 45;
      const pm10Val = hourlyPm10[i] ?? 70;
      const indiaCalc = calculateCpcbNaqi({
        pm2_5: pm25Val,
        pm10: pm10Val,
        nitrogen_dioxide: hourlyNo2[i],
        ozone: hourlyOzone[i],
      });

      const weatherIdx = weatherHourlyTimes.findIndex((wt) => wt === t);

      hourlyHistorical.push({
        time: t,
        displayTime,
        usAqi: Math.round(hourlyUsAqi[i] ?? finalUsAqi),
        indiaAqi: indiaCalc.naqi,
        pm2_5: Math.round(pm25Val),
        pm10: Math.round(pm10Val),
        nitrogen_dioxide: hourlyNo2[i] ? Math.round(hourlyNo2[i]) : undefined,
        ozone: hourlyOzone[i] ? Math.round(hourlyOzone[i]) : undefined,
        temperature: weatherIdx >= 0 ? Math.round(weatherHourlyTemp[weatherIdx] ?? temperature) : temperature,
        humidity: weatherIdx >= 0 ? Math.round(weatherHourlyHumid[weatherIdx] ?? humidity) : humidity,
        isHistorical: true,
      });
    }

    // Forecast points: next 48 points after current index
    const forecastStart = validCurrentIdx;
    const forecastEnd = Math.min(hourlyTimes.length, forecastStart + 48);
    const hourlyForecast: HourlyAQIPoint[] = [];
    for (let i = forecastStart; i < forecastEnd; i++) {
      const t = hourlyTimes[i];
      const d = new Date(t);
      const displayTime = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      const pm25Val = hourlyPm25[i] ?? 45;
      const pm10Val = hourlyPm10[i] ?? 70;
      const indiaCalc = calculateCpcbNaqi({
        pm2_5: pm25Val,
        pm10: pm10Val,
        nitrogen_dioxide: hourlyNo2[i],
        ozone: hourlyOzone[i],
      });

      const weatherIdx = weatherHourlyTimes.findIndex((wt) => wt === t);

      hourlyForecast.push({
        time: t,
        displayTime,
        usAqi: Math.round(hourlyUsAqi[i] ?? finalUsAqi),
        indiaAqi: indiaCalc.naqi,
        pm2_5: Math.round(pm25Val),
        pm10: Math.round(pm10Val),
        nitrogen_dioxide: hourlyNo2[i] ? Math.round(hourlyNo2[i]) : undefined,
        ozone: hourlyOzone[i] ? Math.round(hourlyOzone[i]) : undefined,
        temperature: weatherIdx >= 0 ? Math.round(weatherHourlyTemp[weatherIdx] ?? temperature) : temperature,
        humidity: weatherIdx >= 0 ? Math.round(weatherHourlyHumid[weatherIdx] ?? humidity) : humidity,
        isHistorical: false,
      });
    }

    return {
      city: {
        ...city,
        isIndianCity: inIndia,
      },
      lastUpdated: clientFetchTimestamp,
      clientFetchTimestamp,
      modelRunTimestamp: modelRunTimeFormatted,
      camsSource: "Copernicus Atmosphere Monitoring Service (ECMWF CAMS)",
      source: "Open-Meteo Copernicus CAMS Model Grid (Numerical Atmospheric Assimilation)",
      sourceType: "MODELLED_CAMS_GRID",
      isCpcbGroundStation: false,
      cpcbDisclaimer: inIndia
        ? "Assimilated via European Centre for Medium-Range Weather Forecasts (ECMWF) Copernicus CAMS ~10km grid. This is numerical atmospheric assimilation, NOT direct physical CPCB ground station hardware."
        : "Copernicus CAMS atmospheric numerical grid simulation (~10km resolution).",
      dataNature: isLive ? "Live Modelled Forecast (CAMS Grid)" : "Demo Data",
      calculationStandard:
        activeStandard === "INDIA_CPCB"
          ? "India National AQI (CPCB 6-Pollutant Sub-Index Algorithm)"
          : "US EPA Air Quality Index (NowCast Concentration)",
      activeStandard,
      referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
      usAqi: finalUsAqi,
      indiaAqi: finalIndiaAqi,
      displayAqi,
      category: usCategory,
      indiaCategory,
      displayCategory,
      nowCastConcentration: nowCastResult.nowCastConcentration,
      isNowCastCalculated: isLive,
      isDemoData: !isLive,
      europeanAqi: Math.round(current.european_aqi ?? 50),
      primaryPollutant: activeStandard === "INDIA_CPCB" ? cpcbResult.dominantPollutant : "PM2.5",
      healthSummary: advisory.headline,
      temperature,
      humidity,
      windSpeed,
      weather: weatherCondition,
      pollutants,
      hourlyForecast,
      hourlyHistorical,
      inversionRisk: {
        level: inversionLevel,
        description: isInversionProne
          ? "Atmospheric temperature inversion active. Stagnant ground mist and low wind velocity trap surface smog."
          : "Favorable wind dispersion with active convective vertical air mixing.",
        tempInversion: isInversionProne,
        windSpeed,
        humidity,
        trappedSmogProbability,
      },
      recommendations: {
        general: advisory.general,
        vulnerable: advisory.sensitive,
        outdoorActivity:
          displayAqi > 180
            ? "Avoid all strenuous outdoor exertion. Shift workouts indoors."
            : displayAqi > 100
            ? "Limit morning and late evening outdoor runs."
            : "Outdoor conditions safe for moderate exercise.",
        ventilation:
          displayAqi > 150
            ? "Keep windows sealed. Use internal HEPA recirculating air filtration."
            : "Brief midday window airing permitted when solar convection peaks.",
        maskRequired: advisory.mask,
      },
    };
  } catch (err) {
    console.error("Open-Meteo Air Quality fetch error:", err);
    throw err;
  }
}
