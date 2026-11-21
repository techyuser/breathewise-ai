/**
 * Sustainability & Environmental Impact Engine
 * Based on IPCC 2023 transport guidelines, CEA India grid carbon intensity, and standard vehicle emission factors.
 */

export type TransitMode = "car_petrol" | "car_diesel" | "carpool" | "metro" | "ev" | "cycling" | "walk";

export interface TransportModeConfig {
  id: TransitMode;
  name: string;
  emissionFactorGPerKm: number; // grams CO2e per passenger-km
  fuelEfficiencyKmPerL?: number; // km per liter
  description: string;
}

export const TRANSPORT_MODES: Record<TransitMode, TransportModeConfig> = {
  car_petrol: {
    id: "car_petrol",
    name: "Solo Petrol Car",
    emissionFactorGPerKm: 192,
    fuelEfficiencyKmPerL: 13.5,
    description: "Standard 1.2L–1.5L private petrol automobile driven solo.",
  },
  car_diesel: {
    id: "car_diesel",
    name: "Solo Diesel Car",
    emissionFactorGPerKm: 178,
    fuelEfficiencyKmPerL: 16.0,
    description: "Private diesel passenger car with elevated NOx and primary soot output.",
  },
  carpool: {
    id: "carpool",
    name: "Carpool (3 Passengers)",
    emissionFactorGPerKm: 64,
    fuelEfficiencyKmPerL: 40.5,
    description: "Shared ride dividing emissions and fuel across 3 passengers.",
  },
  metro: {
    id: "metro",
    name: "Electric Metro / Urban Rail",
    emissionFactorGPerKm: 45,
    description: "High-capacity mass rapid transit powered by centralized electrical grid.",
  },
  ev: {
    id: "ev",
    name: "Electric Vehicle (EV)",
    emissionFactorGPerKm: 51,
    description: "Battery electric vehicle accounting for national grid well-to-wheel generation.",
  },
  cycling: {
    id: "cycling",
    name: "Bicycle / Cycle Commute",
    emissionFactorGPerKm: 0,
    description: "Zero tailpipe and zero upstream operational emissions.",
  },
  walk: {
    id: "walk",
    name: "Walking / Foot Commute",
    emissionFactorGPerKm: 0,
    description: "100% zero-emission human-powered transit.",
  },
};

export const CALCULATION_ASSUMPTIONS = {
  petrolPricePerLiter: 96.72, // Average Indian Metro Petrol price in INR
  dieselPricePerLiter: 89.62,
  averageFuelPrice: 94.0,
  carPetrolEfficiency: 13.5, // km per liter
  workingDaysPerMonth: 22,
  carEmissionFactor: 0.192, // kg CO2e per km
  co2AbsorbedPerTreePerYear: 21.8, // kg CO2 / year
  respiratoryBreathingRateLPerMin: 12.0, // Resting/commute breathing rate
};

export interface TransportComparisonResult {
  dailyDistanceKm: number; // One-way distance input
  effectiveDailyDistanceKm: number; // Actual distance traversed daily (1x or 2x if round-trip)
  isRoundTrip: boolean;
  workingDaysPerMonth: number;
  baselineMode: TransitMode;
  chosenMode: TransitMode;
  co2SavedDailyKg: number;
  co2SavedMonthlyKg: number;
  fuelSavedDailyLiters: number;
  fuelSavedMonthlyLiters: number;
  moneySavedDailyInr: number;
  moneySavedMonthlyInr: number;
  particulateExposureAvoidedMg: number;
  treesEquivalentAnnual: number;
  baselineEmissionFactor: number;
  chosenEmissionFactor: number;
}

/**
 * Calculates fuel savings, CO2 mitigation, monetary savings, and monthly projections
 * comparing a baseline car commute against alternative green transit choices.
 * Accounts for 2-way daily round-trip commute when isRoundTrip is true (default).
 */
export function calculateTransportationComparison(
  distanceKm: number,
  chosenMode: TransitMode = "metro",
  baselineMode: TransitMode = "car_petrol",
  workingDaysPerMonth: number = 22,
  isRoundTrip: boolean = true
): TransportComparisonResult {
  const baseline = TRANSPORT_MODES[baselineMode] || TRANSPORT_MODES.car_petrol;
  const chosen = TRANSPORT_MODES[chosenMode] || TRANSPORT_MODES.metro;

  const effectiveDailyDistanceKm = isRoundTrip ? distanceKm * 2 : distanceKm;

  // CO2 Emissions (kg CO2e)
  const baselineCo2Kg = (effectiveDailyDistanceKm * baseline.emissionFactorGPerKm) / 1000;
  const chosenCo2Kg = (effectiveDailyDistanceKm * chosen.emissionFactorGPerKm) / 1000;
  const co2SavedDailyKg = Math.max(0, Number((baselineCo2Kg - chosenCo2Kg).toFixed(2)));
  const co2SavedMonthlyKg = Number((co2SavedDailyKg * workingDaysPerMonth).toFixed(1));

  // Fuel Savings (Liters)
  let fuelSavedDailyLiters = 0;
  if (baseline.fuelEfficiencyKmPerL && baseline.fuelEfficiencyKmPerL > 0) {
    const baselineFuelLiters = effectiveDailyDistanceKm / baseline.fuelEfficiencyKmPerL;
    const chosenFuelLiters = chosen.fuelEfficiencyKmPerL ? effectiveDailyDistanceKm / chosen.fuelEfficiencyKmPerL : 0;
    fuelSavedDailyLiters = Math.max(0, Number((baselineFuelLiters - chosenFuelLiters).toFixed(2)));
  }
  const fuelSavedMonthlyLiters = Number((fuelSavedDailyLiters * workingDaysPerMonth).toFixed(1));

  // Monetary Savings (INR)
  const fuelPrice = baselineMode === "car_diesel" ? CALCULATION_ASSUMPTIONS.dieselPricePerLiter : CALCULATION_ASSUMPTIONS.petrolPricePerLiter;
  const moneySavedDailyInr = Math.round(fuelSavedDailyLiters * fuelPrice);
  const moneySavedMonthlyInr = Math.round(fuelSavedMonthlyLiters * fuelPrice);

  // Avoided fine particulate lung inhalation (mg PM2.5 avoided by being in filtered Metro/EV or cycling off-peak)
  const particulateExposureAvoidedMg = Number((effectiveDailyDistanceKm * 0.42).toFixed(1));

  // Tree absorption equivalent (annual trees needed to absorb this monthly saving extrapolated to year)
  const annualCo2Kg = co2SavedMonthlyKg * 12;
  const treesEquivalentAnnual = Number((annualCo2Kg / CALCULATION_ASSUMPTIONS.co2AbsorbedPerTreePerYear).toFixed(1));

  return {
    dailyDistanceKm: distanceKm,
    effectiveDailyDistanceKm,
    isRoundTrip,
    workingDaysPerMonth,
    baselineMode,
    chosenMode,
    co2SavedDailyKg,
    co2SavedMonthlyKg,
    fuelSavedDailyLiters,
    fuelSavedMonthlyLiters,
    moneySavedDailyInr,
    moneySavedMonthlyInr,
    particulateExposureAvoidedMg,
    treesEquivalentAnnual,
    baselineEmissionFactor: baseline.emissionFactorGPerKm,
    chosenEmissionFactor: chosen.emissionFactorGPerKm,
  };
}

/**
 * Legacy API bridge helpers
 */
export function calculateCarbonSavings(distanceKm: number, mode: "transit" | "cycling" | "ev"): number {
  const map: Record<string, TransitMode> = {
    transit: "metro",
    cycling: "cycling",
    ev: "ev",
  };
  const res = calculateTransportationComparison(distanceKm, map[mode] || "metro");
  return res.co2SavedDailyKg;
}

export function calculateExposureAvoided(outdoorAqi: number, durationHours: number, isProtected: boolean): number {
  if (!isProtected) return 0;
  const reductionFactor = 0.8;
  return Math.round(outdoorAqi * durationHours * reductionFactor);
}

export function calculateEnergySaved(hoursSealed: number): number {
  const AVG_AC_LOAD = 1.2;
  const EFFICIENCY_GAIN = 0.15;
  return Number((hoursSealed * AVG_AC_LOAD * EFFICIENCY_GAIN).toFixed(2));
}
