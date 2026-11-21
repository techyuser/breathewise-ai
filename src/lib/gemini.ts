import { GoogleGenAI } from "@google/genai";
import { AirQualityData } from "@/types/air-quality";
import { RoutineActivity, generateDailyRoutine } from "./intelligence/routine-generator";
import { HomeConfig, IndoorRecommendation, assessIndoorAir } from "./intelligence/indoor-assessment";

// Server-side only: never expose GEMINI_API_KEY to client code
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

export interface AssistantMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  sources?: string[];
  suggestedActions?: string[];
}

export interface UserProfileContext {
  sensitivity?: "general" | "infant" | "respiratory" | "elderly" | "athlete" | "pregnant";
  hasAirPurifier?: boolean;
  hasN95Mask?: boolean;
  outdoorActivityPlanned?: string;
  homeVentilation?: "open" | "sealed";
  cohort?: string;
  commuteMode?: string;
  hasKids?: boolean;
  hasElderly?: boolean;
  hasRespiratory?: boolean;
  commuteDistanceKm?: number;
}

// ============================================================================
// HACKATHON LEAN CACHING LAYER (Saves up to 90% Gemini quota during judge demos)
// ============================================================================
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

const routineCache = new Map<string, CacheEntry<RoutineActivity[]>>();
const indoorCache = new Map<string, CacheEntry<IndoorRecommendation[]>>();
const impactCache = new Map<string, CacheEntry<{ explanation: string; tips: string[] }>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  if (entry) map.delete(key);
  return null;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, data: T) {
  map.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

/**
 * COMPACT SYSTEM PROMPT - Optimized for ultra-low token consumption & fast latency
 */
export const BREATHEWISE_SYSTEM_PROMPT = `
You are BreatheWise AI, a concise respiratory intelligence guide.
RULES:
1. Grounded in provided Open-Meteo & CAMS telemetry. NEVER hallucinate unmeasured values.
2. In India, note data is Copernicus CAMS model grid (~10km), not physical rooftop CPCB hardware.
3. Recommend physical protections (N95/FFP2 masks, true HEPA H13, avoiding morning boundary inversions). Not a medical doctor.
4. If asked in Hindi or lang=hi, reply in natural Hindi (हिंदी).
5. ULTRA-CONCISE: Respond in under 120 words with clear bullet points. Avoid filler text.
`;

/**
 * Compact context payload (drastically reduced token footprint)
 */
export function constructIntelligenceContext(
  aqiData: AirQualityData,
  profile?: UserProfileContext,
  lang: "en" | "hi" = "en"
): string {
  const pm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const aqiValue = aqiData.activeStandard === "INDIA_CPCB" ? aqiData.indiaAqi : aqiData.usAqi;
  const aqiCat = aqiData.activeStandard === "INDIA_CPCB" ? aqiData.indiaCategory : aqiData.category;

  return `CONTEXT: ${aqiData.city.name} | AQI: ${aqiValue} (${aqiCat}) | Dominant: PM2.5 ${pm25}µg/m³ (WHO limit: 15) | Temp: ${aqiData.temperature}°C | Humidity: ${aqiData.humidity}% | Wind: ${aqiData.windSpeed}km/h | Inversion Risk: ${aqiData.inversionRisk.level} (${aqiData.inversionRisk.trappedSmogProbability}% trapped) | Cohort: ${profile?.sensitivity || "general"} | Lang: ${lang === "hi" ? "Hindi (हिंदी)" : "English"}`;
}

/**
 * Fallback generator when API key is missing or quota is exhausted.
 */
function generateHeuristicAssistantResponse(
  query: string,
  aqiData: AirQualityData,
  profile?: UserProfileContext,
  lang: "en" | "hi" = "en"
): string {
  const isCpcb = aqiData.activeStandard === "INDIA_CPCB";
  const aqi = isCpcb ? aqiData.indiaAqi : aqiData.usAqi;
  const pm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const city = aqiData.city.name;
  const lowerQ = query.toLowerCase();

  if (lang === "hi") {
    if (lowerQ.includes("jog") || lowerQ.includes("exercise") || lowerQ.includes("दौड़")) {
      return aqi > 150
        ? `### 🛑 बाहरी व्यायाम स्थगित करें (${city}):\n\n* **AQI:** ${aqi} (${aqiData.indiaCategory}), PM2.5: ${pm25} µg/m³\n* **जोखिम:** तेज सांस से फेफड़ों में सूक्ष्म कण जमा होते हैं।\n* **सलाह:** इनडोर वर्कआउट करें और HEPA प्यूरीफायर चालू रखें।`
        : `### ✅ बाहरी गतिविधि सुरक्षित (${city}):\n\n* **AQI:** ${aqi}। सामान्य बाहरी व्यायाम सुरक्षित है।`;
    }
    if (lowerQ.includes("mask") || lowerQ.includes("मास्क")) {
      return `### 😷 मास्क सुरक्षा निर्देश:\n\n* केवल **N95 / FFP2** रेस्पिरेटर का उपयोग करें।\n* कपड़े या सामान्य सर्जिकल मास्क PM2.5 को रोकने में असमर्थ हैं।\n* नाक की क्लिप को टाइट रखें।`;
    }
    return `### 🌿 वायु गुणवत्ता सारांश (${city}):\n\n* **AQI:** ${aqi} (${aqiData.indiaCategory}) | **PM2.5:** ${pm25} µg/m³\n* **तापमान व्युत्क्रमण:** ${aqiData.inversionRisk.level}\n* **सलाह:** सुबह 6 से 9:30 बजे बाहरी आवागमन सीमित रखें और N95 मास्क पहनें।`;
  }

  if (lowerQ.includes("jog") || lowerQ.includes("run") || lowerQ.includes("exercise") || lowerQ.includes("walk")) {
    return aqi > 150
      ? `### 🛑 Outdoor Exercise Directive for ${city}:\n\n* **AQI:** ${aqi} (${isCpcb ? aqiData.indiaCategory : aqiData.category}) | **PM2.5:** ${pm25} µg/m³\n* **Risk:** High breathing rate causes deep pulmonary particle deposition.\n* **Guidance:** Shift to indoor workout or wait until midday (12:00–3:00 PM) when solar convection clears surface smog.`
      : `### ✅ Favorable Outdoor Conditions for ${city}:\n\n* Current AQI is **${aqi}** (${isCpcb ? aqiData.indiaCategory : aqiData.category}). Moderate outdoor exercise is safe.`;
  }

  if (lowerQ.includes("mask") || lowerQ.includes("n95") || lowerQ.includes("respirator")) {
    return `### 😷 Respiratory Protection Guidance:\n\n* **Standard:** Use certified **N95 / FFP2** respirators with adjustable nasal seal for adults.\n* **Pediatric Caution:** Standard adult N95s do not seal on children's faces and increase breathing resistance. For school-age children, use pediatric-sized KF94/FFP2 with airtight fit. **Never place particulate masks on infants under 2 years**.\n* **Cloth/Surgical:** Ineffective against microscopic PM2.5 particles.`;
  }

  if (lowerQ.includes("purifier") || lowerQ.includes("cadr") || lowerQ.includes("indoor")) {
    return `### 🏠 HEPA Sizing Guidance:\n\n* **CADR Rule:** Sizing CFM should equal 2/3 of room square footage (e.g., 300 sq ft $\\rightarrow$ 200 CFM).\n* **Filtration:** True HEPA H13 (EN 1822 certified for 0.3 µm particulates) + activated carbon.\n* **Ventilation:** Keep windows latched when outdoor PM2.5 exceeds 60 µg/m³; rely on indoor recirculating filtration.`;
  }

  return `### 🌿 Environmental Intelligence for ${city}:\n\n* **AQI:** ${aqi} (${isCpcb ? aqiData.indiaCategory : aqiData.category}) | **PM2.5:** ${pm25} µg/m³\n* **Inversion Risk:** ${aqiData.inversionRisk.level} (${aqiData.inversionRisk.trappedSmogProbability}% smog trap)\n* **Key Actions:** Equip N95 masks for outdoor commutes; operate indoor HEPA filtration.`;
}

/**
 * Streaming chat assistant: Truncates history to last 2 messages & limits output to 350 tokens
 */
export async function streamAirIntelligence(
  messages: AssistantMessage[],
  aqiData: AirQualityData,
  profile?: UserProfileContext,
  lang: "en" | "hi" = "en"
): Promise<AsyncIterable<{ text?: string }>> {
  const client = getGeminiClient();

  if (!client) {
    const lastUserQuery = messages.filter((m) => m.role === "user").pop()?.content || "";
    const responseText = generateHeuristicAssistantResponse(lastUserQuery, aqiData, profile, lang);

    return {
      async *[Symbol.asyncIterator]() {
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(" ") + " ";
          yield { text: chunk };
          await new Promise((r) => setTimeout(r, 15));
        }
      },
    };
  }

  const contextPrompt = constructIntelligenceContext(aqiData, profile, lang);
  
  // ULTRA-LEAN: Only pass the most recent 2 historical messages to save prompt tokens
  const trimmedHistory = messages.slice(-3, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content.slice(0, 300) }], // cap length
  }));

  const lastUserMsg = messages[messages.length - 1]?.content || "What are today's smog risks?";
  const userContent = `${contextPrompt}\nQUERY: ${lastUserMsg}`;

  const contents = [
    ...trimmedHistory,
    { role: "user", parts: [{ text: userContent }] },
  ];

  try {
    return await client.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents,
      config: {
        systemInstruction: BREATHEWISE_SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 350, // ULTRA-LEAN: Cap generation at ~350 tokens
      },
    });
  } catch (error) {
    console.warn("Gemini quota or stream error, falling back to heuristic engine:", error);
    const responseText = generateHeuristicAssistantResponse(lastUserMsg, aqiData, profile, lang);

    return {
      async *[Symbol.asyncIterator]() {
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(" ") + " ";
          yield { text: chunk };
          await new Promise((r) => setTimeout(r, 12));
        }
      },
    };
  }
}

/**
 * Structured Routine with 20-minute Cache
 */
export async function generateStructuredRoutineWithGemini(
  aqiData: AirQualityData,
  profile?: UserProfileContext,
  lang: "en" | "hi" = "en"
): Promise<RoutineActivity[]> {
  const cacheKey = `${aqiData.city.id}:${lang}:${profile?.sensitivity || "general"}`;
  const cached = getCached(routineCache, cacheKey);
  if (cached) {
    return cached;
  }

  const client = getGeminiClient();
  if (!client) {
    const routine = generateDailyRoutine(aqiData, lang);
    setCached(routineCache, cacheKey, routine);
    return routine;
  }

  const context = constructIntelligenceContext(aqiData, profile, lang);
  const prompt = `Generate 5 daily air hygiene slots based on: ${context}.
Output JSON array: [{"time":"06:00 AM","displayTime":"6 AM","activity":"string in ${lang === "hi" ? "Hindi" : "English"}","recommendation":"string","status":"safe"|"caution"|"avoid","reason":"string","language":"${lang}"}]`;

  try {
    const res = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 500, // Lean output
      },
    });

    const text = res.text?.trim() || "";
    const parsed = JSON.parse(text) as RoutineActivity[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      setCached(routineCache, cacheKey, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("Gemini routine call failed or cached:", err);
  }

  const fallback = generateDailyRoutine(aqiData, lang);
  setCached(routineCache, cacheKey, fallback);
  return fallback;
}

/**
 * Indoor Advice with 20-minute Cache
 */
export async function generateIndoorAdviceWithGemini(
  aqiData: AirQualityData,
  home: HomeConfig,
  lang: "en" | "hi" = "en"
): Promise<IndoorRecommendation[]> {
  const cacheKey = `${aqiData.city.id}:${lang}:${home.windowsOpen}:${home.hasAirPurifier}:${home.isCooking}`;
  const cached = getCached(indoorCache, cacheKey);
  if (cached) {
    return cached;
  }

  const client = getGeminiClient();
  if (!client) {
    const advice = assessIndoorAir(aqiData, home, lang);
    setCached(indoorCache, cacheKey, advice);
    return advice;
  }

  const pm25 = aqiData.pollutants.pm2_5?.value ?? aqiData.nowCastConcentration;
  const prompt = `Outdoor PM2.5 is ${pm25}µg/m³. WindowsOpen: ${home.windowsOpen}, Purifier: ${home.hasAirPurifier}, Cooking: ${home.isCooking}. Lang: ${lang}.
Output 3 JSON items: [{"action":"string","urgency":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL","reason":"string","category":"ventilation"|"purification"|"source_control"}]`;

  try {
    const res = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 350,
      },
    });

    const text = res.text?.trim() || "";
    const parsed = JSON.parse(text) as IndoorRecommendation[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      setCached(indoorCache, cacheKey, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("Gemini indoor advice error:", err);
  }

  const fallback = assessIndoorAir(aqiData, home, lang);
  setCached(indoorCache, cacheKey, fallback);
  return fallback;
}

/**
 * Environmental Impact Explanation with 20-minute Cache
 */
export async function explainImpactWithGemini(
  stats: {
    co2Saved: number;
    exposureAvoided: number;
    energyOptimized: number;
    distance: number;
    mode: string;
  },
  lang: "en" | "hi" = "en"
): Promise<{ explanation: string; tips: string[] }> {
  const cacheKey = `${stats.mode}:${stats.distance}:${lang}`;
  const cached = getCached(impactCache, cacheKey);
  if (cached) {
    return cached;
  }

  const client = getGeminiClient();
  if (!client) {
    const fallback =
      lang === "hi"
        ? {
            explanation: `आपने ${stats.distance} किमी की यात्रा में ${stats.mode} चुनकर ${stats.co2Saved} किग्रा CO₂ का उत्सर्जन कम किया।`,
            tips: [
              "रेड लाइट पर इंजन बंद रखें।",
              "सुबह के पीक स्मॉग में मेट्रो चुनें।",
              "HEPA प्यूरीफायर को साफ रखें।",
            ],
          }
        : {
            explanation: `Your clean transit choice mitigated ${stats.co2Saved} kg of CO₂ and averted ${stats.exposureAvoided} units of toxic particulate inhalation.`,
            tips: [
              "Cut engine idling during prolonged traffic stops.",
              "Favor metro transit during morning inversion peaks.",
              "Maintain clean HEPA filters to optimize airflow efficiency.",
            ],
          };
    setCached(impactCache, cacheKey, fallback);
    return fallback;
  }

  const prompt = `Distance: ${stats.distance}km, Mode: ${stats.mode}, CO2Saved: ${stats.co2Saved}kg, Lang: ${lang}.
Output JSON: {"explanation":"2 concise sentences in ${lang === "hi" ? "Hindi" : "English"}","tips":["tip1","tip2","tip3"]}`;

  try {
    const res = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 250,
      },
    });

    const text = res.text?.trim() || "";
    const parsed = JSON.parse(text);
    setCached(impactCache, cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.warn("Gemini impact explanation error:", err);
  }

  const fallback = {
    explanation: `Your clean transit choice mitigated ${stats.co2Saved} kg of CO₂ and averted ${stats.exposureAvoided} units of direct toxic particulate inhalation.`,
    tips: [
      "Cut engine idling during prolonged red lights.",
      "Shift morning commutes to electric rail during inversion peaks.",
      "Maintain clean HEPA filters to optimize purifier airflow.",
    ],
  };
  setCached(impactCache, cacheKey, fallback);
  return fallback;
}
