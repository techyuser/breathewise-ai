/**
 * WMO Weather interpretation codes (WW)
 * Provided by Open-Meteo Weather Forecast API
 */
export interface WeatherMeta {
  code: number;
  description: string;
  condition: "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunderstorm";
  iconName: string;
}

export function parseWmoWeatherCode(code: number): WeatherMeta {
  switch (code) {
    case 0:
      return { code, description: "Clear Sky", condition: "clear", iconName: "Sun" };
    case 1:
      return { code, description: "Mainly Clear", condition: "clear", iconName: "SunMedium" };
    case 2:
      return { code, description: "Partly Cloudy", condition: "cloudy", iconName: "CloudSun" };
    case 3:
      return { code, description: "Overcast", condition: "cloudy", iconName: "Cloud" };
    case 45:
      return { code, description: "Dense Fog / Smog Mist", condition: "fog", iconName: "CloudFog" };
    case 48:
      return { code, description: "Depositing Rime Fog", condition: "fog", iconName: "CloudFog" };
    case 51:
      return { code, description: "Light Drizzle", condition: "drizzle", iconName: "CloudDrizzle" };
    case 53:
      return { code, description: "Moderate Drizzle", condition: "drizzle", iconName: "CloudDrizzle" };
    case 55:
      return { code, description: "Dense Drizzle", condition: "drizzle", iconName: "CloudDrizzle" };
    case 61:
      return { code, description: "Slight Rain", condition: "rain", iconName: "CloudRain" };
    case 63:
      return { code, description: "Moderate Rain", condition: "rain", iconName: "CloudRain" };
    case 65:
      return { code, description: "Heavy Rain", condition: "rain", iconName: "CloudRain" };
    case 71:
    case 73:
    case 75:
      return { code, description: "Snow Fall", condition: "snow", iconName: "CloudSnow" };
    case 80:
    case 81:
    case 82:
      return { code, description: "Rain Showers", condition: "rain", iconName: "CloudRain" };
    case 95:
    case 96:
    case 99:
      return { code, description: "Thunderstorm", condition: "thunderstorm", iconName: "CloudLightning" };
    default:
      return { code, description: "Moderate Cloud Cover", condition: "cloudy", iconName: "Cloud" };
  }
}
