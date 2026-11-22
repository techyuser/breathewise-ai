import { test, expect } from "@playwright/test";
import {
  calculateCpcbNaqi,
  getCpcbCategory,
  calculateCpcbSubIndex,
  CPCB_BREAKPOINTS,
} from "../src/lib/cpcb-utils";
import {
  calculateNowCastAqi,
  getAQICategory,
} from "../src/lib/aqi-utils";
import {
  verifyPlanDeterministic,
  parseTimeToHour,
  getPeriodFromHour,
  getDiurnalMultiplier,
  UserPlanInput,
} from "../src/lib/intelligence/plan-verifier";
import { AirQualityData } from "../src/types/air-quality";

test.describe("Scientific Calculations - CPCB NAQI & EPA NowCast Validation", () => {
  // =========================================================================
  // 1. CPCB BREAKPOINT INTERPOLATION & BOUNDARY CONDITIONS
  // =========================================================================
  test("1.1 CPCB Sub-Index Breakpoint Calculations for all 6 Criteria Pollutants", () => {
    // PM2.5 (24-hr avg):
    // 0 - 30 -> 0 - 50 (Good)
    expect(calculateCpcbSubIndex(15, CPCB_BREAKPOINTS.pm2_5)).toBe(25);
    expect(calculateCpcbSubIndex(30, CPCB_BREAKPOINTS.pm2_5)).toBe(50);
    // 31 - 60 -> 51 - 100 (Satisfactory)
    expect(calculateCpcbSubIndex(60, CPCB_BREAKPOINTS.pm2_5)).toBe(100);
    // 61 - 90 -> 101 - 200 (Moderate)
    expect(calculateCpcbSubIndex(90, CPCB_BREAKPOINTS.pm2_5)).toBe(200);
    // 91 - 120 -> 201 - 300 (Poor)
    expect(calculateCpcbSubIndex(120, CPCB_BREAKPOINTS.pm2_5)).toBe(300);
    // 121 - 250 -> 301 - 400 (Very Poor)
    expect(calculateCpcbSubIndex(250, CPCB_BREAKPOINTS.pm2_5)).toBe(400);
    // 250+ -> 401 - 500 (Severe)
    expect(calculateCpcbSubIndex(380, CPCB_BREAKPOINTS.pm2_5)).toBe(452);
    expect(calculateCpcbSubIndex(500, CPCB_BREAKPOINTS.pm2_5)).toBe(500);

    // PM10 (24-hr avg):
    expect(calculateCpcbSubIndex(50, CPCB_BREAKPOINTS.pm10)).toBe(50);
    expect(calculateCpcbSubIndex(100, CPCB_BREAKPOINTS.pm10)).toBe(100);
    expect(calculateCpcbSubIndex(250, CPCB_BREAKPOINTS.pm10)).toBe(200);
    expect(calculateCpcbSubIndex(350, CPCB_BREAKPOINTS.pm10)).toBe(300);
    expect(calculateCpcbSubIndex(430, CPCB_BREAKPOINTS.pm10)).toBe(400);

    // Nitrogen Dioxide (NO2):
    expect(calculateCpcbSubIndex(40, CPCB_BREAKPOINTS.nitrogen_dioxide)).toBe(50);
    expect(calculateCpcbSubIndex(80, CPCB_BREAKPOINTS.nitrogen_dioxide)).toBe(100);

    // Sulphur Dioxide (SO2):
    expect(calculateCpcbSubIndex(40, CPCB_BREAKPOINTS.sulphur_dioxide)).toBe(50);
    expect(calculateCpcbSubIndex(80, CPCB_BREAKPOINTS.sulphur_dioxide)).toBe(100);

    // Carbon Monoxide (CO - 8-hr avg mg/m3):
    expect(calculateCpcbSubIndex(1.0, CPCB_BREAKPOINTS.carbon_monoxide)).toBe(50);
    expect(calculateCpcbSubIndex(2.0, CPCB_BREAKPOINTS.carbon_monoxide)).toBe(100);

    // Ozone (O3 - 8-hr avg):
    expect(calculateCpcbSubIndex(50, CPCB_BREAKPOINTS.ozone)).toBe(50);
    expect(calculateCpcbSubIndex(100, CPCB_BREAKPOINTS.ozone)).toBe(100);
  });

  test("1.2 CPCB Category Mapping & Boundary Cases", () => {
    expect(getCpcbCategory(0)).toBe("Good");
    expect(getCpcbCategory(50)).toBe("Good");
    expect(getCpcbCategory(51)).toBe("Satisfactory");
    expect(getCpcbCategory(100)).toBe("Satisfactory");
    expect(getCpcbCategory(101)).toBe("Moderate");
    expect(getCpcbCategory(200)).toBe("Moderate");
    expect(getCpcbCategory(201)).toBe("Poor");
    expect(getCpcbCategory(300)).toBe("Poor");
    expect(getCpcbCategory(301)).toBe("Very Poor");
    expect(getCpcbCategory(400)).toBe("Very Poor");
    expect(getCpcbCategory(401)).toBe("Severe");
    expect(getCpcbCategory(500)).toBe("Severe");
    expect(getCpcbCategory(null)).toBe("Insufficient Data");
  });

  // =========================================================================
  // 2. CPCB DATA COMPLETENESS RULES (P0 Scientific Requirement)
  // =========================================================================
  test("2.1 CPCB Rejects Insufficient Pollutants (< 3 pollutants)", () => {
    // Only 2 pollutants provided (PM2.5 and PM10) -> Must return null naqi
    const result = calculateCpcbNaqi({
      pm2_5: 65,
      pm10: 120,
    });

    expect(result.isDataSufficient).toBe(false);
    expect(result.naqi).toBeNull();
    expect(result.dominantPollutant).toBe("Insufficient Data");
    expect(result.pollutantsCount).toBe(2);
    expect(result.insufficiencyReason).toContain("CPCB NAQI requires at least 3 monitored pollutants");
    // Sub-indices should still be computed and kept separate
    expect(result.subIndices["PM2.5"]).toBeGreaterThan(0);
    expect(result.subIndices["PM10"]).toBeGreaterThan(0);
  });

  test("2.2 CPCB Rejects When Core Particulates (PM2.5 or PM10) are Absent", () => {
    // 4 gases provided (NO2, SO2, CO, O3), but neither PM2.5 nor PM10 -> Must return null
    const result = calculateCpcbNaqi({
      nitrogen_dioxide: 45,
      sulphur_dioxide: 20,
      carbon_monoxide: 1.2,
      ozone: 55,
    });

    expect(result.isDataSufficient).toBe(false);
    expect(result.naqi).toBeNull();
    expect(result.hasCoreParticulates).toBe(false);
    expect(result.pollutantsCount).toBe(4);
    expect(result.insufficiencyReason).toContain("core particulate indicator (PM2.5 or PM10)");
  });

  test("2.3 CPCB Produces Valid NAQI When Complete (>= 3 pollutants with particulate)", () => {
    const result = calculateCpcbNaqi({
      pm2_5: 85,
      pm10: 160,
      nitrogen_dioxide: 50,
      sulphur_dioxide: 25,
      carbon_monoxide: 1.5,
      ozone: 70,
    });

    expect(result.isDataSufficient).toBe(true);
    expect(typeof result.naqi).toBe("number");
    expect(result.naqi).toBeGreaterThan(100);
    expect(result.pollutantsCount).toBe(6);
    expect(result.hasCoreParticulates).toBe(true);
    expect(result.dominantPollutant).toBeDefined();
    expect(result.dominantPollutant).not.toBe("Insufficient Data");
  });

  test("2.4 CPCB Input Validation Rejects Negative Numbers and Non-Finites", () => {
    const result = calculateCpcbNaqi({
      pm2_5: -45, // Invalid negative
      pm10: NaN, // Invalid non-finite
      nitrogen_dioxide: Infinity, // Invalid non-finite
      sulphur_dioxide: 25,
    });

    expect(result.isDataSufficient).toBe(false);
    expect(result.naqi).toBeNull();
    expect(result.pollutantsCount).toBe(1); // Only SO2 was valid
  });

  // =========================================================================
  // 3. US EPA NOWCAST PM2.5 ALGORITHM & DECAY WEIGHTING
  // =========================================================================
  test("3.1 NowCast EPA Availability Rule: Requires at least 2 valid values in latest 3 clock hours", () => {
    // Scenario A: Only 1 observation in latest 3 hours (h=0 valid, h=1 null, h=2 null)
    const historySingleRecent = [
      40, 45, 50, 55, 60, 65, 70, 75, 80, // older hours (h=3..11)
      null, null, 85, // latest 3 hours (h=2, 1, 0) -> only 85 at h=0
    ];

    const resA = calculateNowCastAqi(historySingleRecent);
    expect(resA.isDataSufficient).toBe(false);
    expect(resA.aqi).toBeNull();
    expect(resA.nowCastConcentration).toBeNull();
    expect(resA.latest3HoursCount).toBe(1);

    // Scenario B: 2 valid observations in latest 3 hours (h=0 valid, h=2 valid)
    const historyTwoRecent = [
      40, 45, 50, 55, 60, 65, 70, 75, 80, // older
      50, null, 85, // h=2 (50), h=1 (null), h=0 (85) -> 2 valid!
    ];

    const resB = calculateNowCastAqi(historyTwoRecent);
    expect(resB.isDataSufficient).toBe(true);
    expect(typeof resB.aqi).toBe("number");
    expect(typeof resB.nowCastConcentration).toBe("number");
    expect(resB.latest3HoursCount).toBe(2);
  });

  test("3.2 NowCast Weighting: Gap Preservation Using Actual Elapsed Hour Exponent h", () => {
    // If hour offset h=1 is missing, hour offset h=2 must use weight w^2, NOT w^1
    // Let's test with constant concentration where w = Cmin/Cmax = 1.0
    // Under constant concentration C = 50:
    // With w = 1, sum(w^h * C) / sum(w^h) = 50 exactly, regardless of gaps.
    const constantWithGaps = [
      null, 50, null, 50, null, 50, null, 50, null, 50, null, 50,
    ];
    const res = calculateNowCastAqi(constantWithGaps);
    expect(res.isDataSufficient).toBe(true);
    expect(res.nowCastConcentration).toBe(50.0);
  });

  test("3.3 NowCast Zero Particulate Concentration Handling", () => {
    // When PM2.5 is completely clean (0 µg/m3)
    const cleanAir = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const res = calculateNowCastAqi(cleanAir);

    expect(res.isDataSufficient).toBe(true);
    expect(res.nowCastConcentration).toBe(0.0);
    expect(res.aqi).toBe(0);
    expect(getAQICategory(res.aqi)).toBe("Good");
  });

  test("3.4 NowCast Wildfire / Severe Smog Spike Responsiveness", () => {
    // Rapid smog increase: concentrations jump from 30 to 180 in 2 hours
    // Rapid change -> w* = Cmin/Cmax = 30/180 = 0.166 -> clamped to minimum 0.5
    // Most weight concentrated on the most recent 1-2 hours
    const spikeHistory = [
      25, 28, 30, 30, 32, 35, 40, 45, 50, 90, 140, 180,
    ];
    const res = calculateNowCastAqi(spikeHistory);

    expect(res.isDataSufficient).toBe(true);
    // Since recent hours are 180, 140, 90 with w=0.5, NowCast concentration must be heavily weighted toward recent hours (> 130)
    expect(res.nowCastConcentration).toBeGreaterThan(130);
    expect(res.aqi).toBeGreaterThan(150); // In unhealthy range
  });

  test("3.5 NowCast Empty & Invalid Inputs Return Honest Insufficient State", () => {
    expect(calculateNowCastAqi([]).isDataSufficient).toBe(false);
    expect(calculateNowCastAqi([]).aqi).toBeNull();
    // Non-finite array
    expect(calculateNowCastAqi([NaN, undefined, null]).isDataSufficient).toBe(false);
    expect(calculateNowCastAqi([NaN, undefined, null]).aqi).toBeNull();
  });

  // =========================================================================
  // 4. AI ACTIVITY PLAN VERIFICATION & DIURNAL PHYSIOLOGY
  // =========================================================================
  test("4.1 Time Parsing and Diurnal Phase Determination", () => {
    expect(parseTimeToHour("07:00 AM")).toBe(7);
    expect(parseTimeToHour("01:30 PM")).toBe(13.5);
    expect(parseTimeToHour("06:30 PM")).toBe(18.5);
    expect(parseTimeToHour("12:00 PM")).toBe(12);
    expect(parseTimeToHour("12:00 AM")).toBe(0);

    expect(getPeriodFromHour(7)).toBe("morning");
    expect(getPeriodFromHour(13.5)).toBe("afternoon");
    expect(getPeriodFromHour(19)).toBe("evening");

    // Morning stagnation vs afternoon convection
    expect(getDiurnalMultiplier(7)).toBeGreaterThan(1.2);
    expect(getDiurnalMultiplier(14)).toBeLessThan(0.8);
  });

  test("4.2 Severe Morning Smog Triggers Avoid Verdict for Vigorous Outdoor Exertion", () => {
    const mockAqiData = {
      city: { id: "delhi", name: "Delhi", region: "Delhi", country: "India", lat: 28.6, lon: 77.2 },
      lastUpdated: new Date().toISOString(),
      clientFetchTimestamp: new Date().toISOString(),
      modelRunTimestamp: new Date().toISOString(),
      camsSource: "CAMS Grid",
      source: "Open-Meteo",
      sourceType: "MODELLED_CAMS_GRID",
      isCpcbGroundStation: false,
      cpcbDisclaimer: "Test",
      dataNature: "Latest Modelled Air-Quality Data (CAMS Grid)",
      calculationStandard: "India CPCB",
      activeStandard: "INDIA_CPCB",
      referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
      usAqi: 240,
      indiaAqi: 310,
      category: "Very Unhealthy",
      indiaCategory: "Very Poor",
      temperature: 18,
      humidity: 75,
      windSpeed: 4.5,
      pollutants: {
        pm2_5: {
          code: "pm2_5",
          name: "PM2.5",
          chemicalFormula: "PM2.5",
          value: 120,
          unit: "µg/m³",
          whoLimit: 15,
          percentageOfLimit: 800,
          status: "Severe",
          description: "Elevated",
        },
      } as any,
      inversionRisk: {
        level: "High",
        description: "Surface inversion",
        tempInversion: true,
        windSpeed: 4.5,
        humidity: 75,
        trappedSmogProbability: 85,
      },
      nowCastConcentration: 120,
      hourlyForecast: [],
    } as unknown as AirQualityData;

    const plan: UserPlanInput = {
      activityName: "Morning 5K Outdoor Run",
      plannedTime: "07:00 AM",
      durationMinutes: 45,
      environment: "outdoor",
      intensity: "vigorous",
      cohort: "athlete",
      hasN95Mask: false,
    };

    const result = verifyPlanDeterministic(plan, mockAqiData, "en");

    expect(result.status).toBe("avoid");
    expect(result.period).toBe("morning");
    expect(result.safetyScore).toBeLessThan(50);
    expect(result.estimatedInhaledDoseUg).toBeGreaterThan(50); // Massive inhaled alveolar deposition
    expect(result.suggestedAlternativeTime).toBe("01:30 PM"); // Suggests afternoon solar convection window
    expect(result.protectiveMeasures.length).toBeGreaterThan(0);
  });

  test("4.3 Indoor HEPA Filtration Provides Optimal Safety Clearance", () => {
    const mockAqiData = {
      city: { id: "delhi", name: "Delhi", region: "Delhi", country: "India", lat: 28.6, lon: 77.2 },
      lastUpdated: new Date().toISOString(),
      clientFetchTimestamp: new Date().toISOString(),
      modelRunTimestamp: new Date().toISOString(),
      camsSource: "CAMS Grid",
      source: "Open-Meteo",
      sourceType: "MODELLED_CAMS_GRID",
      isCpcbGroundStation: false,
      cpcbDisclaimer: "Test",
      dataNature: "Latest Modelled Air-Quality Data (CAMS Grid)",
      calculationStandard: "India CPCB",
      activeStandard: "INDIA_CPCB",
      referenceBenchmark: "WHO 2021 24-Hour Guideline Limit (AQG)",
      usAqi: 240,
      indiaAqi: 310,
      category: "Very Unhealthy",
      indiaCategory: "Very Poor",
      temperature: 18,
      humidity: 75,
      windSpeed: 4.5,
      pollutants: {
        pm2_5: {
          code: "pm2_5",
          name: "PM2.5",
          chemicalFormula: "PM2.5",
          value: 120,
          unit: "µg/m³",
          whoLimit: 15,
          percentageOfLimit: 800,
          status: "Severe",
          description: "Elevated",
        },
      } as any,
      inversionRisk: {
        level: "High",
        description: "Surface inversion",
        tempInversion: true,
        windSpeed: 4.5,
        humidity: 75,
        trappedSmogProbability: 85,
      },
      nowCastConcentration: 120,
      hourlyForecast: [],
    } as unknown as AirQualityData;

    const plan: UserPlanInput = {
      activityName: "Indoor Yoga",
      plannedTime: "06:30 AM",
      durationMinutes: 40,
      environment: "indoor_hepa",
      intensity: "light",
      cohort: "asthma",
      hasN95Mask: false,
    };

    const result = verifyPlanDeterministic(plan, mockAqiData, "en");

    expect(result.status).toBe("optimal");
    expect(result.safetyScore).toBeGreaterThanOrEqual(90);
    expect(result.estimatedInhaledDoseUg).toBeLessThan(15);
  });
});
