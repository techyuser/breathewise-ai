import { AirQualityData } from "@/types/air-quality";

export type RoutinePeriod = "morning" | "afternoon" | "evening";
export type RoutineStatus = "safe" | "caution" | "avoid" | "optimal";

export interface RoutineActivity {
  id: string;
  time: string;
  displayTime: string;
  period: RoutinePeriod;
  activity: string;
  recommendation: string;
  status: RoutineStatus;
  location: "Indoor" | "Outdoor";
  explanation: string;
  language: "en" | "hi";
  completed?: boolean;
  impactPoints: number;
}

export interface FamilyProfileInput {
  cohort: "family" | "asthma" | "runner" | "elderly" | "infant";
  hasKids: boolean;
  hasElderly: boolean;
  hasRespiratory: boolean;
  hasAirPurifier: boolean;
  hasN95Mask: boolean;
  commuteMode: "metro" | "carpool" | "car" | "bike" | "walk";
  morningDeparture?: string;
  eveningReturn?: string;
}

export const DEFAULT_FAMILY_PROFILE: FamilyProfileInput = {
  cohort: "family",
  hasKids: true,
  hasElderly: false,
  hasRespiratory: false,
  hasAirPurifier: true,
  hasN95Mask: true,
  commuteMode: "metro",
  morningDeparture: "08:00 AM",
  eveningReturn: "06:30 PM",
};

/**
 * Generates structured Morning, Afternoon, and Evening daily routines
 * incorporating family profile, live atmospheric dispersion physics, and clinical rationales.
 */
export function generateDailyRoutine(
  aqiData: AirQualityData,
  lang: "en" | "hi" = "en",
  profile: FamilyProfileInput = DEFAULT_FAMILY_PROFILE
): RoutineActivity[] {
  const isCpcb = aqiData.activeStandard === "INDIA_CPCB";
  const aqi = isCpcb ? aqiData.indiaAqi : aqiData.usAqi;
  const pm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const isSevere = (aqi !== null && aqi > 200) || (typeof pm25 === "number" && pm25 > 90);
  const isHigh = (aqi !== null && aqi > 120) || (typeof pm25 === "number" && pm25 > 45);

  const routine: RoutineActivity[] = [];

  // ==========================================
  // 1. MORNING ROUTINE (06:00 AM - 11:30 AM)
  // ==========================================
  // Slot 1: Early Morning Workout / Wakeup (06:30 AM)
  let m1Status: RoutineStatus = "safe";
  let m1RecEn = "Outdoor morning exercise permitted with normal breathing rhythms.";
  let m1RecHi = "सामान्य श्वास गति के साथ सुबह का बाहरी व्यायाम अनुमत है।";
  let m1ExpEn = "Low ground-level stagnation allows safe ambient aerobic ventilation.";
  let m1ExpHi = "जमीनी स्तर पर कम प्रदूषण के कारण सुबह की हवा अपेक्षाकृत अनुकूल है।";
  let m1Loc: "Indoor" | "Outdoor" = "Outdoor";

  if (profile.hasRespiratory || profile.cohort === "asthma") {
    m1Status = isHigh ? "avoid" : "caution";
    m1RecEn = "Perform indoor breathing exercises with active HEPA air filtration.";
    m1RecHi = "HEPA एयर प्यूरीफायर चालू रखकर इनडोर प्राणायाम या योग करें।";
    m1ExpEn = "Cold morning air triggers airway hyperresponsiveness and acute bronchospasm when PM2.5 exceeds 35 µg/m³.";
    m1ExpHi = "सुबह की ठंडी हवा और सूक्ष्म कण ब्रोन्कियल नलिकाओं में जलन व सांस फूलने का कारण बनते हैं।";
    m1Loc = "Indoor";
  } else if (profile.cohort === "runner") {
    if (isHigh) {
      m1Status = "avoid";
      m1RecEn = "Shift cardio workout to an indoor treadmill or delay until 1:00 PM.";
      m1RecHi = "कार्डियो व्यायाम ट्रेडमिल पर घर के अंदर करें या दोपहर 1:00 बजे तक टालें।";
      m1ExpEn = `At current PM2.5 levels (${pm25} µg/m³), high respiratory minute volume deposits microscopic particles deep into lung alveoli.`;
      m1ExpHi = `तीव्र दौड़ में सांस की गति 4 गुना बढ़ने से ${pm25} µg/m³ PM2.5 सीधे फेफड़ों की गहराई तक चला जाता है।`;
      m1Loc = "Indoor";
    }
  } else if (isHigh) {
    m1Status = isSevere ? "avoid" : "caution";
    m1RecEn = isSevere
      ? "Keep windows sealed. Replace outdoor morning walk with indoor stretching."
      : "Limit outdoor brisk walk to under 20 minutes; wear an N95 respirator.";
    m1RecHi = isSevere
      ? "खिड़कियां बंद रखें। सुबह की सैर घर के अंदर ही करें।"
      : "बाहरी सैर 20 मिनट से कम रखें और N95 मास्क अवश्य पहनें।";
    m1ExpEn = "Atmospheric boundary layer thermal inversion traps overnight vehicular exhaust near the surface before sunrise.";
    m1ExpHi = "सूर्य निकलने से पहले तापमान व्युत्क्रमण (Inversion) के कारण वाहनों का धुआं जमीनी हवा में कैद रहता है।";
    m1Loc = isSevere ? "Indoor" : "Outdoor";
  }

  routine.push({
    id: "act-morning-1",
    time: "06:30 AM",
    displayTime: "06:30 AM",
    period: "morning",
    activity: lang === "hi" ? "सुबह की शुरुआत व व्यायाम" : "Morning Physical Activity",
    recommendation: lang === "hi" ? m1RecHi : m1RecEn,
    status: m1Status,
    location: m1Loc,
    explanation: lang === "hi" ? m1ExpHi : m1ExpEn,
    language: lang,
    impactPoints: 25,
  });

  // Slot 2: Morning Commute & School Transit (08:00 AM)
  let m2Status: RoutineStatus = isSevere ? "avoid" : isHigh ? "caution" : "safe";
  let m2RecEn = "";
  let m2RecHi = "";
  let m2ExpEn = "";
  let m2ExpHi = "";

  if (profile.cohort === "infant") {
    m2Status = "avoid";
    m2RecEn = "Keep infants indoors in filtered air. Do NOT place particulate masks on infants or children under 2 (risk of suffocation).";
    m2RecHi = "शिशुओं को घर के अंदर सुरक्षित हवा में रखें। 2 वर्ष से कम उम्र के बच्चों को मास्क बिल्कुल न लगाएं (दम घुटने का जोखिम)।";
    m2ExpEn = "Infant respiratory systems are developing, and tight particulate masks present dangerous airway resistance. Indoor HEPA filtration is the primary recommended public-health defense.";
    m2ExpHi = "शिशुओं की श्वास नलियां नाजुक होती हैं; टाइट मास्क से ऑक्सीजन प्रवाह बाधित हो सकता है। इनडोर एयर प्यूरीफायर ही एकमात्र सुरक्षित उपाय है।";
  } else if (profile.hasKids) {
    m2RecEn = "Keep school vehicle windows closed and cabin AC on recirculate. For school-age children, use certified pediatric-sized KF94/FFP2 masks with a verified seal; standard adult N95s do not fit pediatric facial structures.";
    m2RecHi = "स्कूल बस की खिड़कियां बंद रखें व एसी को रीसर्क्युलेशन पर रखें। स्कूली बच्चों के लिए केवल प्रमाणित बाल-आकार (Pediatric KF94/FFP2) मास्क इस्तेमाल करें—वयस्क N95 बच्चों के चेहरे पर ठीक नहीं बैठते।";
    m2ExpEn = "Adult N95 respirators leave perimeter gaps on children's smaller faces, rendering filtration ineffective. Properly sized pediatric respirators or filtered transit cabins are required.";
    m2ExpHi = "वयस्क N95 मास्क बच्चों के छोटे चेहरे पर ढीले रहते हैं जिससे प्रदूषित हवा किनारों से अंदर जाती है। सही आकार का बाल मास्क या वातानुकूलित केबिन आवश्यक है।";
  } else if (profile.commuteMode === "metro") {
    m2Status = "safe";
    m2RecEn = "Use air-conditioned Metro/Rail transit. Walk underground concourses to bypass street-level diesel exhaust.";
    m2RecHi = "वातानुकूलित मेट्रो का उपयोग करें। सड़क के धुएं से बचने के लिए भूमिगत रास्तों का चयन करें।";
    m2ExpEn = "Underground electric rail avoids road-surface diesel canyons, reducing exposure by up to 70%.";
    m2ExpHi = "भूमिगत मेट्रो में सड़क की तुलना में 70% कम वाहन प्रदूषण और कालिख होती है।";
  } else {
    m2RecEn = "Wear certified N95 mask; turn car AC to recirculate mode (anti-infiltration).";
    m2RecHi = "N95 मास्क पहनें और कार के एसी को रीसर्क्युलेशन मोड पर सेट करें।";
    m2ExpEn = "Peak morning traffic congestion creates dense localized NO2 and PM2.5 hotspots along arterial corridors.";
    m2ExpHi = "सुबह के पीक ट्रैफिक में सड़क चौराहों पर NO2 और PM2.5 का स्तर खतरनाक रूप से बढ़ जाता है।";
  }

  routine.push({
    id: "act-morning-2",
    time: profile.morningDeparture || "08:00 AM",
    displayTime: profile.morningDeparture || "08:00 AM",
    period: "morning",
    activity: lang === "hi" ? "स्कूल व कार्यस्थल आवागमन" : "School & Work Commute",
    recommendation: lang === "hi" ? m2RecHi : m2RecEn,
    status: m2Status,
    location: "Outdoor",
    explanation: lang === "hi" ? m2ExpHi : m2ExpEn,
    language: lang,
    impactPoints: 30,
  });

  // ==========================================
  // 2. AFTERNOON ROUTINE (12:00 PM - 04:30 PM)
  // ==========================================
  // Slot 3: Midday Solar Convection & Recess (01:30 PM)
  const canVentilate = !isSevere && (typeof pm25 !== "number" || pm25 <= 60) && (aqi === null || aqi <= 150);
  routine.push({
    id: "act-afternoon-1",
    time: "01:30 PM",
    displayTime: "01:30 PM",
    period: "afternoon",
    activity: lang === "hi" ? "दोपहर का वेंटिलेशन व आउटडोर समय" : "Midday Ventilation & Outdoor Window",
    recommendation: canVentilate
      ? lang === "hi"
        ? "घर व कार्यालय में 15-20 मिनट के लिए क्रॉस-वेंटिलेशन करें। आवश्यक बाहरी कार्य इस समय निपटाएं।"
        : "Optimal window for 15-20 minute cross-ventilation as boundary layer peaks. Schedule essential outdoor errands during this interval."
      : lang === "hi"
        ? "बाहरी PM2.5 स्तर 60 µg/m³ से अधिक है। खिड़कियां बंद रखें और इनडोर HEPA प्यूरीफायर पर ही निर्भर रहें, प्राकृतिक वेंटिलेशन न करें।"
        : "Outdoor PM2.5 exceeds safe ventilation limits (>60 µg/m³). Keep windows firmly latched; rely on continuous indoor HEPA recirculation rather than outside air.",
    status: canVentilate ? "optimal" : "avoid",
    location: canVentilate ? "Outdoor" : "Indoor",
    explanation: canVentilate
      ? lang === "hi"
        ? "दोपहर में धूप से धरातल गर्म होता है, जिससे थर्मल मिक्सिंग से प्रदूषण ऊपर उठ जाता है और हवा दिन में सबसे साफ होती है।"
        : "Solar thermal radiation maximizes planetary boundary layer height (~1,200m), dispersing trapped surface smog and yielding the cleanest daily air."
      : lang === "hi"
        ? "यद्यपि दोपहर में मिक्सिंग बढ़ती है, फिर भी कुल प्रदूषण सुरक्षित जैविक सीमा से अधिक है, अतः खिड़की खोलने से इनडोर हवा दूषित होगी।"
        : "Even with midday solar convection, ambient particulate density remains biologically elevated; bringing outdoor air inside would introduce toxic particulate load.",
    language: lang,
    impactPoints: 20,
  });

  // ==========================================
  // 3. EVENING & NIGHT ROUTINE (05:00 PM - 10:00 PM+)
  // ==========================================
  // Slot 4: Evening Commute & Rush Hour (06:30 PM)
  routine.push({
    id: "act-evening-1",
    time: profile.eveningReturn || "06:30 PM",
    displayTime: profile.eveningReturn || "06:30 PM",
    period: "evening",
    activity: lang === "hi" ? "शाम का आवागमन व खरीदारी" : "Evening Commute & Errands",
    recommendation:
      lang === "hi"
        ? "शाम 6:30 के बाद बाहरी खुली गतिविधियों से बचें। N95 मास्क का उपयोग करें।"
        : "Don N95 respirator. Avoid open-air roadside dining and street markets during sunset rush hour.",
    status: isHigh ? "avoid" : "caution",
    location: isHigh ? "Indoor" : "Outdoor",
    explanation:
      lang === "hi"
        ? "शाम को तापमान गिरने से स्मॉग दोबारा जमीनी सतह पर बैठने लगता है (थर्मल इनवर्जन री-ट्रैपिंग)।"
        : "Surface cooling initiates nocturnal radiation inversion, collapsing the boundary layer and re-trapping evening vehicle emissions at breathing height.",
    language: lang,
    impactPoints: 25,
  });

  // Slot 5: Overnight Sleep Air Hygiene (09:30 PM)
  routine.push({
    id: "act-evening-2",
    time: "09:30 PM",
    displayTime: "09:30 PM",
    period: "evening",
    activity: lang === "hi" ? "रात्रि शयन व इनडोर सीलिंग" : "Overnight Rest & Bedroom HEPA Sealing",
    recommendation:
      lang === "hi"
        ? "बेडरूम की खिड़कियां कसकर बंद करें। एयर प्यूरीफायर को स्लीप/लो मोड पर रातभर चालू रखें।"
        : "Seal bedroom windows and door thresholds. Operate HEPA air purifier on quiet sleep mode continuously.",
    status: "safe",
    location: "Indoor",
    explanation:
      lang === "hi"
        ? "रात भर कमरों की हवा शुद्ध रखने से फेफड़ों को 8 घंटे का रिकवरी समय मिलता है और अगले दिन की सूजन कम होती है।"
        : "8 hours of nocturnal clean-air breathing (PM2.5 < 10 µg/m³) drastically reduces systemic vascular inflammation and prevents morning asthma attacks.",
    language: lang,
    impactPoints: 35,
  });

  return routine;
}
