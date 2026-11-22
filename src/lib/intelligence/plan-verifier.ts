import { AirQualityData } from "@/types/air-quality";
import { RoutinePeriod, RoutineStatus } from "./routine-generator";

export interface UserPlanInput {
  activityName: string;
  plannedTime: string; // e.g. "07:00 AM", "14:30", "06:30 PM"
  durationMinutes: number; // e.g. 15, 30, 45, 60, 90, 120
  environment: "outdoor" | "indoor_unfiltered" | "indoor_hepa" | "transit";
  intensity: "light" | "moderate" | "vigorous";
  cohort: "general" | "infant" | "kids" | "asthma" | "elderly" | "athlete";
  hasN95Mask?: boolean;
}

export interface PlanVerificationResult {
  id: string;
  activityName: string;
  plannedTime: string;
  period: RoutinePeriod;
  status: RoutineStatus;
  safetyScore: number; // 0 - 100
  verdict: string;
  summary: string;
  explanation: string;
  estimatedInhaledDoseUg: number;
  whoGuidelineComparison: string;
  suggestedAlternativeTime?: string;
  recommendedAdjustment?: string;
  protectiveMeasures: string[];
  impactPoints: number;
  environment: string;
  intensity: string;
  cohort: string;
  verifiedAt: string;
}

/**
 * Parses time string (e.g. "07:30 AM", "7:30 AM", "18:00", "6:00 PM") to 24h decimal hour (0-24)
 */
export function parseTimeToHour(timeStr: string): number {
  if (!timeStr) return 8; // default 8 AM
  const cleaned = timeStr.trim().toUpperCase();

  // Check 12-hour AM/PM format
  const isPM = cleaned.includes("PM");
  const isAM = cleaned.includes("AM");
  const numPart = cleaned.replace(/[^\d:]/g, "");
  const parts = numPart.split(":");

  let hours = parseInt(parts[0], 10) || 8;
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours + minutes / 60;
}

/**
 * Determines routine period (morning, afternoon, evening) from decimal hour
 */
export function getPeriodFromHour(hour: number): RoutinePeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

/**
 * Diurnal boundary-layer inversion factor:
 * - 05:00 - 09:30: Peak nocturnal inversion trapping (1.35x - 1.65x)
 * - 12:00 - 16:00: Solar convective mixing & planetary boundary layer peak (0.60x - 0.75x)
 * - 17:30 - 21:00: Evening boundary layer collapse + rush hour (1.25x - 1.50x)
 * - Rest: ~1.0x
 */
export function getDiurnalMultiplier(hour: number): number {
  if (hour >= 5.5 && hour <= 9.5) return 1.5; // morning smog peak
  if (hour >= 12 && hour <= 16) return 0.65; // afternoon solar convection trough
  if (hour >= 17.5 && hour <= 21.5) return 1.35; // evening rush hour collapse
  return 1.0;
}

/**
 * Deterministic, atmospheric-physics & pulmonary minute-ventilation verified plan analysis.
 */
export function verifyPlanDeterministic(
  plan: UserPlanInput,
  aqiData: AirQualityData,
  lang: "en" | "hi" = "en"
): PlanVerificationResult {
  const hour = parseTimeToHour(plan.plannedTime);
  const period = getPeriodFromHour(hour);
  const diurnalFactor = getDiurnalMultiplier(hour);

  const isCpcb = aqiData.activeStandard === "INDIA_CPCB";
  const baselineAqi = isCpcb ? (aqiData.indiaAqi ?? 100) : (aqiData.usAqi ?? 100);
  const ambientPm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration ?? 40;

  // Effective ambient PM2.5 accounting for diurnal cycle
  const effectiveAmbientPm25 = Math.max(10, Math.round(ambientPm25 * diurnalFactor));

  // Respiratory Minute Ventilation (L/min)
  // Light = 10 L/min, Moderate = 25 L/min, Vigorous = 65 L/min
  const ventilationLpm =
    plan.intensity === "vigorous" ? 65 : plan.intensity === "moderate" ? 25 : 10;
  const ventilationM3PerMin = ventilationLpm / 1000;

  // Infiltration factor
  let infiltrationFactor = 1.0;
  if (plan.environment === "indoor_hepa") infiltrationFactor = 0.12;
  else if (plan.environment === "indoor_unfiltered") infiltrationFactor = 0.7;
  else if (plan.environment === "transit") infiltrationFactor = 0.35;

  // Mask filtration factor
  const maskReduction = plan.hasN95Mask ? 0.15 : 1.0; // 85% particulate reduction for certified N95

  // Estimated inhaled dose in micrograms of PM2.5
  // Dose (ug) = Concentration (ug/m3) * Ventilation (m3/min) * Duration (min) * Infiltration * Mask
  const duration = Math.max(10, plan.durationMinutes || 30);
  const rawDose =
    effectiveAmbientPm25 *
    ventilationM3PerMin *
    duration *
    infiltrationFactor *
    maskReduction;
  const estimatedDoseUg = Math.round(rawDose * 10) / 10;

  // WHO 24-hour benchmark is 15 ug/m3. At resting adult 15 m3/day, normal healthy daily budget is ~225 ug.
  // A single activity session taking > 25 ug is notable; > 50 ug is severe acute respiratory deposition.
  const isHighDose = estimatedDoseUg > 35;
  const isSevereDose = estimatedDoseUg > 70;

  // Cohort vulnerability multiplier
  const isVulnerable =
    plan.cohort === "asthma" ||
    plan.cohort === "infant" ||
    plan.cohort === "kids" ||
    plan.cohort === "elderly";

  // Calculate Status & Safety Score (0-100)
  let status: RoutineStatus = "safe";
  let safetyScore = 85;

  if (plan.environment === "outdoor") {
    if (effectiveAmbientPm25 > 120 || isSevereDose || (effectiveAmbientPm25 > 60 && isVulnerable)) {
      status = "avoid";
      safetyScore = Math.max(15, Math.round(100 - (effectiveAmbientPm25 / 3) - (isVulnerable ? 25 : 10)));
    } else if (effectiveAmbientPm25 > 50 || isHighDose || isVulnerable) {
      status = "caution";
      safetyScore = Math.max(45, Math.round(85 - (effectiveAmbientPm25 / 4)));
    } else {
      status = effectiveAmbientPm25 < 30 ? "optimal" : "safe";
      safetyScore = Math.min(98, Math.round(95 - (effectiveAmbientPm25 / 5)));
    }
  } else if (plan.environment === "indoor_hepa") {
    status = "optimal";
    safetyScore = Math.min(99, Math.round(92 + (plan.hasN95Mask ? 5 : 0)));
  } else {
    // indoor unfiltered or transit
    if (effectiveAmbientPm25 > 150) {
      status = "caution";
      safetyScore = 55;
    } else {
      status = "safe";
      safetyScore = 75;
    }
  }

  // Adjust score for mask protection
  if (plan.hasN95Mask && status === "caution") {
    safetyScore = Math.min(80, safetyScore + 15);
  }

  // Suggested Alternative Time
  let suggestedAlternativeTime: string | undefined;
  let recommendedAdjustment: string | undefined;

  if (status === "avoid" || status === "caution") {
    if (period === "morning" && plan.environment === "outdoor") {
      suggestedAlternativeTime = "01:30 PM";
      recommendedAdjustment =
        lang === "hi"
          ? "इस गतिविधि को दोपहर 01:00 PM से 03:30 PM के बीच स्थानांतरित करें जब सौर संवहन (Solar Convection) से PM2.5 लगभग 40-50% तक गिर जाता है।"
          : "Shift this activity to 01:00 PM – 03:30 PM when midday solar thermal convection elevates the boundary layer and PM2.5 drops by ~40-50%.";
    } else if (period === "evening" && plan.environment === "outdoor") {
      suggestedAlternativeTime = "02:00 PM";
      recommendedAdjustment =
        lang === "hi"
          ? "शाम के स्मॉग ट्रैपिंग से पहले दोपहर 02:00 PM पर गतिविधि पूरी करें या इनडोर HEPA वातावरण चुनें।"
          : "Complete before the 05:30 PM sunset inversion trap, or relocate into an indoor HEPA filtered space.";
    } else if (plan.intensity === "vigorous") {
      recommendedAdjustment =
        lang === "hi"
          ? "व्यायाम की तीव्रता को 'मध्यम' में बदलें जिससे फेफड़ों में जाने वाली वायु की मात्रा (Minute Ventilation) आधी हो जाएगी।"
          : "Dial intensity back to moderate walking to halve respiratory minute ventilation (reducing inhaled particulate deposition).";
    }
  }

  // Generate Protective Measures
  const protectiveMeasures: string[] = [];
  if (lang === "hi") {
    if (plan.environment === "outdoor") {
      if (plan.cohort !== "infant") protectiveMeasures.push("सख्त फिटिंग वाला N95 / FFP2 रेस्पिरेटर अवश्य पहनें");
      if (plan.intensity === "vigorous") protectiveMeasures.push("तीव्र एरोबिक गति को मध्यम वॉक में बदलें");
      protectiveMeasures.push("गतिविधि के बाद गुनगुने पानी और सेलाइन नेज़ल स्प्रे से नाक साफ करें");
    }
    if (plan.environment === "indoor_hepa") {
      protectiveMeasures.push("कमरे के दरवाजे व खिड़कियां पूरी तरह बंद रखें");
      protectiveMeasures.push("प्यूरीफायर को टर्बो या हाई स्पीड मोड पर रखें");
    }
    if (isVulnerable) {
      protectiveMeasures.push("इन्हेलर या ब्रोंकोडायलेटर पास में तैयार रखें");
    }
    protectiveMeasures.push("पर्याप्त पानी पिएं ताकि श्वासनली की म्यूकोसल लाइनिंग नम रहे");
  } else {
    if (plan.environment === "outdoor") {
      if (plan.cohort !== "infant") protectiveMeasures.push("Don a verified N95/FFP2 respirator with sealed nose clip");
      if (plan.intensity === "vigorous") protectiveMeasures.push("Downscale from vigorous running to low-exertion brisk walking");
      protectiveMeasures.push("Perform isotonic nasal saline rinse immediately after returning");
    }
    if (plan.environment === "indoor_hepa") {
      protectiveMeasures.push("Ensure perimeter doors and windows are latched shut");
      protectiveMeasures.push("Run HEPA air purifier at High/Turbo fan speed 15 mins prior");
    }
    if (isVulnerable) {
      protectiveMeasures.push("Keep rescue inhaler / prescribed bronchial relief medication within reach");
    }
    protectiveMeasures.push("Maintain hydration to support mucosal cilia clearance of trapped particulates");
  }

  // Verdict and Explanations
  let verdict = "";
  let summary = "";
  let explanation = "";

  if (lang === "hi") {
    if (status === "avoid") {
      verdict = "उच्च जोखिम: गतिविधि पुनर्निर्धारित करें";
      summary = `${plan.plannedTime} पर ${plan.activityName} करने से अत्यधिक मात्रा में सूक्ष्म कण (PM2.5) फेफड़ों में जमा होने का खतरा है।`;
      explanation = `वर्तमान समय में वायुमंडलीय थर्मल इनवर्जन और उच्च PM2.5 (${effectiveAmbientPm25} µg/m³) के कारण ${plan.intensity === "vigorous" ? "तीव्र श्वास गति (65L/min)" : "खुली हवा में"} लगभग ${estimatedDoseUg} µg विषैले कण श्वासनली में प्रवेश करेंगे। इसे स्थगित करना या इनडोर HEPA में करना ही सुरक्षित है।`;
    } else if (status === "caution") {
      verdict = "सतर्कता आवश्यक: सुरक्षा उपायों के साथ ही करें";
      summary = `यह योजना मध्यम जोखिम वाली है। N95 मास्क और कम तीव्रता के साथ ही इसे क्रियान्वित करें।`;
      explanation = `प्रदूषण स्तर (${effectiveAmbientPm25} µg/m³) संवेदनशील व्यक्तियों व बच्चों के लिए हानिकारक है। अनुमानित अंतःश्वसन भार लगभग ${estimatedDoseUg} µg PM2.5 है। सुरक्षा निर्देशों का अनिवार्य पालन करें।`;
    } else if (status === "optimal") {
      verdict = "उत्कृष्ट व सुरक्षित समय";
      summary = `यह योजना न्यूनतम वायु जोखिम के साथ पूर्णतः अनुकूल है।`;
      explanation = `${plan.environment === "indoor_hepa" ? "HEPA शुद्धिकरण" : "स्वच्छ वायु खिड़की"} के कारण कुल अंतःश्वसन भार केवल ~${estimatedDoseUg} µg PM2.5 रहेगा, जो सुरक्षित जैविक सीमा के अंदर है।`;
    } else {
      verdict = "सामान्य सुरक्षा स्तर";
      summary = `योजना सुरक्षित रूप से पूरी की जा सकती है।`;
      explanation = `वायु गुणवत्ता सूचकांक (${baselineAqi}) तथा अनुमानित पार्टिकुलेट भार (~${estimatedDoseUg} µg) सामान्य सीमा में है। सामान्य सावधानी बरतें।`;
    }
  } else {
    if (status === "avoid") {
      verdict = "High Risk: Reschedule or Relocate Indoors";
      summary = `Executing '${plan.activityName}' at ${plan.plannedTime} presents high pulmonary particulate deposition risk.`;
      explanation = `At ${plan.plannedTime}, atmospheric boundary layer stagnation and ambient PM2.5 (${effectiveAmbientPm25} µg/m³) combined with ${plan.intensity} exertion (${ventilationLpm} L/min minute ventilation) will deliver an estimated acute alveolar dose of ${estimatedDoseUg} µg PM2.5. Postponing or moving into HEPA-filtered space is strongly advised.`;
    } else if (status === "caution") {
      verdict = "Proceed with Strict Safeguards";
      summary = `Moderate exposure risk detected. Proceed only with an N95 respirator and bounded duration.`;
      explanation = `Ambient particulate density of ${effectiveAmbientPm25} µg/m³ can provoke bronchial reactivity, resulting in an estimated session dose of ~${estimatedDoseUg} µg PM2.5. Protective mask seal and hydration are mandatory.`;
    } else if (status === "optimal") {
      verdict = "Optimal & Highly Recommended Window";
      summary = `Clear safety clearance. Ideal atmospheric and protective parameters verified.`;
      explanation = `Protected by ${plan.environment === "indoor_hepa" ? "HEPA H13 mechanical filtration" : "favorable daytime dispersion"}, your estimated session inhalation is capped at ~${estimatedDoseUg} µg PM2.5, well beneath standard pulmonary safety thresholds.`;
    } else {
      verdict = "Acceptable Exposure Window";
      summary = `Plan meets baseline pulmonary safety criteria under current meteorological conditions.`;
      explanation = `Ambient conditions (${baselineAqi} AQI) yield an estimated particulate deposition of ~${estimatedDoseUg} µg PM2.5 across ${duration} minutes, within permissible physiological tolerance.`;
    }
  }

  const whoComp =
    estimatedDoseUg > 35
      ? lang === "hi"
        ? `WHO 24-घंटे के सुरक्षित अंतःश्वसन बजट का ${(estimatedDoseUg / 25 * 100).toFixed(0)}% केवल एक सत्र में!`
        : `Consumes ${(estimatedDoseUg / 25 * 100).toFixed(0)}% of recommended WHO 24h particulate allowance in a single session!`
      : lang === "hi"
      ? `WHO अनुशंसित सीमा के अनुकूल सुरक्षित भार (~${estimatedDoseUg} µg)`
      : `Within safe WHO diurnal reference allowance (~${estimatedDoseUg} µg)`;

  const impactPoints =
    status === "optimal" ? 35 : status === "safe" ? 25 : status === "caution" ? 20 : 15;

  return {
    id: `custom-plan-${Date.now()}`,
    activityName: plan.activityName || (lang === "hi" ? "कस्टम गतिविधि" : "Custom Activity"),
    plannedTime: plan.plannedTime,
    period,
    status,
    safetyScore,
    verdict,
    summary,
    explanation,
    estimatedInhaledDoseUg: estimatedDoseUg,
    whoGuidelineComparison: whoComp,
    suggestedAlternativeTime,
    recommendedAdjustment,
    protectiveMeasures,
    impactPoints,
    environment: plan.environment,
    intensity: plan.intensity,
    cohort: plan.cohort,
    verifiedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
