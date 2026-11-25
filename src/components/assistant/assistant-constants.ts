import type { AssistantMessage } from "@/lib/gemini";

export type CohortType = "general" | "infant" | "respiratory" | "elderly" | "athlete";

export interface ChatTopicItem {
  id: string;
  title: string;
  category: "Priority Topics" | "Clinical Guidance";
  prompt: string;
}

export const COHORT_OPTIONS: ReadonlyArray<{ id: CohortType; en: string; hi: string }> = [
  { id: "general", en: "General Public", hi: "सामान्य नागरिक" },
  { id: "infant", en: "Pediatric / Child", hi: "शिशु व बच्चे" },
  { id: "respiratory", en: "Asthma / Respiratory", hi: "अस्थमा / सांस रोगी" },
  { id: "elderly", en: "Senior Citizen", hi: "वरिष्ठ नागरिक" },
  { id: "athlete", en: "Outdoor Athlete", hi: "धावक / एथलीट" },
];

export const INITIAL_MESSAGES_EN: AssistantMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    content:
      "Hello! I am your BreatheWise AI Assistant. I analyze real-time Open-Meteo atmospheric forecast models and winter inversion dynamics to provide evidence-based guidance on smog safety, purifier CADR sizing, and pediatric respiratory protection. How can I assist you today?",
    timestamp: "Just now",
    suggestedActions: [
      "Is it safe to jog outside today?",
      "How does temperature inversion trap smog?",
      "What CADR air purifier do I need for a 350 sq ft room?",
      "Differences between N95, KN95, and surgical masks?",
    ],
  },
];

export const INITIAL_MESSAGES_HI: AssistantMessage[] = [
  {
    id: "m-1-hi",
    role: "assistant",
    content:
      "नमस्ते! मैं आपका ब्रीथवाइज़ एआई (BreatheWise AI) सहायक हूँ। मैं ओपन-मेटियो वायुमंडलीय डेटा और सर्दियों के स्मॉग इनवर्जन का विश्लेषण करके सांस की सुरक्षा, मास्क और एयर प्यूरीफायर पर प्रमाणित सलाह देता हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    timestamp: "अभी",
    suggestedActions: [
      "क्या आज बाहर दौड़ना सुरक्षित है?",
      "तापमान व्युत्क्रमण (Inversion) प्रदूषण को कैसे फंसाता है?",
      "350 वर्ग फुट कमरे के लिए कौन सा एयर प्यूरीफायर चाहिए?",
      "N95 और सामान्य सर्जिकल मास्क में क्या अंतर है?",
    ],
  },
];

export const TOPIC_ITEMS_EN: ChatTopicItem[] = [
  {
    id: "h-1",
    title: "Commute mask seal: N95 vs pediatric fit",
    category: "Priority Topics",
    prompt: "How to ensure proper respiratory protection during morning smog commutes?",
  },
  {
    id: "h-2",
    title: "Bedroom HEPA CADR airflow sizing",
    category: "Priority Topics",
    prompt: "What CADR air purifier do I need for a 400 sq ft room?",
  },
  {
    id: "h-3",
    title: "Outdoor cardio vs temperature inversion window",
    category: "Clinical Guidance",
    prompt: "Is it safe to jog outside today during temperature inversion?",
  },
  {
    id: "h-4",
    title: "Certified N95 vs KN95 filtration differences",
    category: "Clinical Guidance",
    prompt: "Differences between N95, KN95, and surgical masks?",
  },
];

export const TOPIC_ITEMS_HI: ChatTopicItem[] = [
  {
    id: "h-1-hi",
    title: "मास्क की सही फिटिंग व सील परीक्षण",
    category: "Priority Topics",
    prompt: "सुबह के स्मॉग में सुरक्षित श्वसन सुरक्षा कैसे सुनिश्चित करें?",
  },
  {
    id: "h-2-hi",
    title: "कमरे के लिए HEPA CADR का सही चुनाव",
    category: "Priority Topics",
    prompt: "कमरे के लिए सही एयर प्यूरीफायर कैसे चुनें?",
  },
  {
    id: "h-3-hi",
    title: "बाहरी व्यायाम बनाम तापमान व्युत्क्रमण",
    category: "Clinical Guidance",
    prompt: "क्या आज इनवर्जन के दौरान बाहर दौड़ना सुरक्षित है?",
  },
  {
    id: "h-4-hi",
    title: "PM2.5 से बचाव के लिए प्रमाणित मास्क",
    category: "Clinical Guidance",
    prompt: "N95 और सामान्य सर्जिकल मास्क में क्या अंतर है?",
  },
];
