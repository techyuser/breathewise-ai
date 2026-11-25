import type { CityLocation } from "@/types/air-quality";

/**
 * Curated global and Indian CPCB benchmark monitoring hubs used for instant switching
 * and server-side atmospheric lookups.
 */
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

/**
 * Determines whether geographic coordinates or country metadata fall inside India
 * for automatic selection of the India CPCB NAQI standard.
 */
export function isLocationInIndia(lat: number, lon: number, country?: string): boolean {
  if (country && country.toLowerCase().includes("india")) return true;
  return lat >= 8.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
}
