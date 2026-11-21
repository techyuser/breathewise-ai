import { AirQualityData } from "@/types/air-quality";

export interface IndoorRecommendation {
  action: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  category: "ventilation" | "purification" | "source_control";
  costTier?: "free" | "under_500" | "500_3000" | "above_3000";
}

export interface IndoorPollutantSource {
  id: string;
  name: string;
  pollutantType: "PM2.5" | "NO2 & VOCs" | "Resuspended Dust" | "Aerosols";
  estimatedContribution: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  description: string;
  mitigation: string;
}

export interface BudgetRecommendation {
  id: string;
  tier: "free" | "under_500" | "500_3000" | "above_3000";
  costLabel: string;
  title: string;
  description: string;
  diyGuide?: string;
  impactReduction: string;
  category: "ventilation" | "filtration" | "source_control";
}

export interface HomeConfig {
  homeSizeSqFt?: number;
  hasAirPurifier: boolean;
  purifierCadr?: number;
  windowsOpen: boolean;
  windowDrafts?: "sealed" | "moderate" | "leaky";
  isCooking?: boolean;
  cookingType?: "lpg_exhaust" | "lpg_no_exhaust" | "electric" | "chulha";
  hasInfiltration?: boolean;
  incenseUsage?: "daily" | "occasional" | "never";
  dustingMethod?: "wet_mop" | "dry_broom" | "hepa_vacuum";
  indoorPlants?: boolean;
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  homeSizeSqFt: 650,
  hasAirPurifier: true,
  purifierCadr: 220,
  windowsOpen: false,
  windowDrafts: "moderate",
  cookingType: "lpg_exhaust",
  hasInfiltration: true,
  incenseUsage: "never",
  dustingMethod: "wet_mop",
  indoorPlants: true,
};

/**
 * Identifies specific indoor pollution sources based on household assessment
 */
export function identifyIndoorSources(
  aqiData: AirQualityData,
  home: HomeConfig
): IndoorPollutantSource[] {
  const outdoorPm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const sources: IndoorPollutantSource[] = [];

  // 1. Outdoor Infiltration
  const isLeaky = home.windowDrafts === "leaky" || home.hasInfiltration;
  const infiltrationShare = isLeaky ? 0.65 : 0.35;
  const estimatedInfiltration = Math.round(outdoorPm25 * infiltrationShare);

  sources.push({
    id: "src-infiltration",
    name: "Outdoor Smog Infiltration",
    pollutantType: "PM2.5",
    estimatedContribution: `+${estimatedInfiltration} µg/m³`,
    severity: outdoorPm25 > 150 ? "CRITICAL" : outdoorPm25 > 60 ? "HIGH" : "MODERATE",
    description: `Fine combustion particles penetrate door gaps and open window frames from outdoor ambient air.`,
    mitigation: "Install door bottom draft sweeps and keep windows latched during high-AQI hours.",
  });

  // 2. Cooking emissions
  if (home.cookingType === "lpg_no_exhaust" || home.cookingType === "chulha" || home.isCooking) {
    sources.push({
      id: "src-cooking",
      name: "Cooking Fumes & Unvented Fuel",
      pollutantType: "NO2 & VOCs",
      estimatedContribution: "+45 to +90 µg/m³",
      severity: home.cookingType === "chulha" ? "CRITICAL" : "HIGH",
      description: "Frying, gas burners, and unvented stove flames produce concentrated nitrogen dioxide and ultrafine oil aerosols.",
      mitigation: "Run high-velocity exhaust fan during cooking and 10 mins post-cooking; cover pots while simmering.",
    });
  }

  // 3. Incense / Agarbatti / Dhoop
  if (home.incenseUsage === "daily" || home.incenseUsage === "occasional") {
    sources.push({
      id: "src-incense",
      name: "Agarbatti & Dhoop Smoke",
      pollutantType: "PM2.5",
      estimatedContribution: "+35 to +85 µg/m³",
      severity: home.incenseUsage === "daily" ? "HIGH" : "MODERATE",
      description: "Burning incense emits polycyclic aromatic hydrocarbons (PAHs), formaldehyde, and fine particulates comparable to cigarette smoke.",
      mitigation: "Transition to non-combustible diffusers or burn near an active exhaust window in a closed prayer room.",
    });
  }

  // 4. Floor Dust Resuspension
  if (home.dustingMethod === "dry_broom") {
    sources.push({
      id: "src-dusting",
      name: "Dry Broom Sweeping (Resuspension)",
      pollutantType: "Resuspended Dust",
      estimatedContribution: "+25 µg/m³ Coarse Dust",
      severity: "MODERATE",
      description: "Traditional dry brooms mechanically lift settled coarse particulate matter back into breathable breathing height for 45 minutes.",
      mitigation: "Replace with microfiber damp wet-mopping or a sealed HEPA-filtered vacuum cleaner.",
    });
  }

  return sources;
}

/**
 * Budget-Based Recommendations across 4 practical price tiers
 */
export function getBudgetRecommendations(
  aqiData: AirQualityData,
  home?: HomeConfig
): BudgetRecommendation[] {
  const outdoorPm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const _hasPurifier = home?.hasAirPurifier ?? false;
  void _hasPurifier;

  return [
    // TIER 1: FREE / ZERO COST (₹0)
    {
      id: "rec-free-1",
      tier: "free",
      costLabel: "Free (₹0)",
      title: "Diurnal Convection Window Airing",
      description:
        outdoorPm25 < 60
          ? "Open windows for exactly 15 minutes between 1:00 PM – 2:30 PM when solar convection dilutes ambient smog."
          : "Keep all windows fully latched today. Rely exclusively on indoor recirculating airflow.",
      diyGuide: "Set a 15-minute phone timer during lunch; close securely before 4:00 PM evening cool-down.",
      impactReduction: "Flushes accumulated indoor CO2 without letting in peak morning smog.",
      category: "ventilation",
    },
    {
      id: "rec-free-2",
      tier: "free",
      costLabel: "Free (₹0)",
      title: "Microfiber Damp-Mopping Protocol",
      description: "Stop dry broom sweeping. Use a damp microfiber cloth or mop to bind settled particulates to moisture.",
      diyGuide: "Add a splash of water or mild vinegar. Mop gently from inner corners toward the entrance door.",
      impactReduction: "Illustrative estimate: Reduces up to ~85% of mechanical dust resuspension during morning cleaning.",
      category: "source_control",
    },
    {
      id: "rec-free-3",
      tier: "free",
      costLabel: "Free (₹0)",
      title: "Wet Towel Threshold Draft Sealing",
      description: "Roll up clean damp towels and press them against gaps under exterior doors and balcony slides.",
      diyGuide: "Dampen a bath towel (not dripping wet), roll tightly, and wedge across the drafty door base.",
      impactReduction: "Illustrative estimate: Blocks up to ~45% of wind-driven particulate infiltration through exterior door seams.",
      category: "ventilation",
    },

    // TIER 2: LOW COST (< ₹500)
    {
      id: "rec-under-500-1",
      tier: "under_500",
      costLabel: "₹250 – ₹350",
      title: "Silicone Under-Door Brush Sweep Stopper",
      description: "Self-adhesive multi-layer silicone weather stripping attached to front and balcony doors.",
      diyGuide: "Clean door bottom with rubbing alcohol, peel 3M adhesive tape, and press firmly against floor line.",
      impactReduction: "Illustrative estimate: Cuts perimeter draft infiltration by up to ~60%.",
      category: "ventilation",
    },
    {
      id: "rec-under-500-2",
      tier: "under_500",
      costLabel: "₹350 – ₹450",
      title: "Activated Bamboo Charcoal Odor Pouches",
      description: "Natural porous carbon pouches that adsorb volatile organic compounds (VOCs) and gaseous NO2 in bedrooms.",
      diyGuide: "Place 2 pouches in closets, near shoe racks, and beside nightstands. Recharge monthly in direct sunlight.",
      impactReduction: "Passive gas adsorption reducing cooking odors and volatile hydrocarbons.",
      category: "source_control",
    },

    // TIER 3: MID COST (₹500 – ₹3,000)
    {
      id: "rec-500-3000-1",
      tier: "500_3000",
      costLabel: "₹1,600 – ₹2,200",
      title: "DIY Corsi-Rosenthal Box Fan Filter",
      description: "High-volume air cleaner assembled by attaching a MERV 13 / H11 pleated filter furnace panel to a standard 16-inch table box fan.",
      diyGuide: "Tape a 16x16-inch MERV 13 pleated filter firmly onto the intake grille of a standard household box fan using duct tape.",
      impactReduction: "Engineering estimate: Delivers clean air equivalent with CADR ~180 CFM.",
      category: "filtration",
    },
    {
      id: "rec-500-3000-2",
      tier: "500_3000",
      costLabel: "₹799",
      title: "Smart Wi-Fi Timer Plug for Auto-Purifier Cycling",
      description: "Automate your air purifier to run at full turbo 45 minutes before bedtime and before morning wakeup.",
      diyGuide: "Plug into wall outlet, configure timer schedule for 5:30 AM – 8:30 AM and 9:00 PM – 7:00 AM.",
      impactReduction: "Illustrative model: Saves electricity while ensuring filtration cycles run during key hours.",
      category: "filtration",
    },

    // TIER 4: COMPREHENSIVE (> ₹3,000)
    {
      id: "rec-above-3000-1",
      tier: "above_3000",
      costLabel: "₹8,500 – ₹13,000",
      title: "True HEPA H13 Purifier (CADR 350+ CFM)",
      description: "Certified mechanical air purifier with True HEPA H13 cylindrical filter (EN 1822 compliant for 0.3 µm particulates) and activated carbon barrel.",
      diyGuide: "Position at least 1.5 feet away from walls in the center of the main family room or bedroom.",
      impactReduction: "Illustrative CADR target: Achieves 4–5 Air Changes per Hour (ACH) for ~300 sq ft room.",
      category: "filtration",
    },
  ];
}

/**
 * Evaluates general indoor recommendations
 */
export function assessIndoorAir(
  aqiData: AirQualityData,
  home: HomeConfig,
  lang: "en" | "hi" = "en"
): IndoorRecommendation[] {
  const recommendations: IndoorRecommendation[] = [];
  const outdoorPm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const isHighPollution = outdoorPm25 > 35;

  if (isHighPollution && home.windowsOpen) {
    recommendations.push({
      action: lang === "hi" ? "खिड़कियां तुरंत बंद करें" : "Seal Windows Immediately",
      urgency: "HIGH",
      reason:
        lang === "hi"
          ? `बाहरी PM2.5 स्तर (${outdoorPm25} µg/m³) अत्यधिक है। खुली खिड़कियां विषैले कणों को अंदर खींच रही हैं।`
          : `Outdoor PM2.5 (${outdoorPm25} µg/m³) is elevated. Open windows allow toxic fine particulates to infiltrate.`,
      category: "ventilation",
      costTier: "free",
    });
  } else if (!isHighPollution && !home.windowsOpen) {
    recommendations.push({
      action: lang === "hi" ? "क्रॉस-वेंटिलेशन के लिए खिड़कियां खोलें" : "Open Windows for Cross-Ventilation",
      urgency: "LOW",
      reason:
        lang === "hi"
          ? "बाहरी हवा स्वच्छ है। कमरों में जमी बासी CO2 को बाहर निकालने के लिए 20 मिनट वेंटिलेशन करें।"
          : "Outdoor air is currently acceptable. Circulate fresh air for 20 minutes to flush indoor CO2.",
      category: "ventilation",
      costTier: "free",
    });
  }

  if (isHighPollution && !home.hasAirPurifier) {
    recommendations.push({
      action: lang === "hi" ? "HEPA एयर प्यूरीफायर या DIY बॉक्स फैन अपनाएं" : "Equip True HEPA or DIY Box Fan",
      urgency: "CRITICAL",
      reason:
        lang === "hi"
          ? "सर्दियों के स्मॉग में बिना मैकेनिकल फिल्ट्रेशन के इनडोर PM2.5 कुछ ही घंटों में 80 µg/m³ पार कर जाता है।"
          : "Without mechanical filtration, indoor PM2.5 equilibrates with outdoor smog within 3 hours.",
      category: "purification",
      costTier: "500_3000",
    });
  }

  if (home.isCooking || home.cookingType === "lpg_no_exhaust") {
    recommendations.push({
      action: lang === "hi" ? "किचन एग्जॉस्ट फैन चलाएं व ढक्कन लगाएं" : "Operate Kitchen Range Hood & Cover Cookware",
      urgency: "HIGH",
      reason:
        lang === "hi"
          ? "खाना पकाने से पैदा होने वाले तेल एरोसोल और NO2 फेफड़ों को उत्तेजित करते हैं।"
          : "High-heat cooking and gas combustion generate concentrated NO2 and ultrafine aerosols.",
      category: "source_control",
      costTier: "free",
    });
  }

  return recommendations;
}
