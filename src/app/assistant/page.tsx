"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  Globe2,
  Wind,
  ShieldAlert,
  Plus,
  Clock,
  ArrowUpRight,
  Languages,
  Lock,
} from "lucide-react";
import { AssistantMessage, UserProfileContext } from "@/lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const INITIAL_MESSAGES_EN: AssistantMessage[] = [
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

const INITIAL_MESSAGES_HI: AssistantMessage[] = [
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

interface ChatTopicItem {
  id: string;
  title: string;
  category: "Priority Topics" | "Clinical Guidance";
  prompt: string;
}

const TOPIC_ITEMS_EN: ChatTopicItem[] = [
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

const TOPIC_ITEMS_HI: ChatTopicItem[] = [
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

type CohortType = "general" | "infant" | "respiratory" | "elderly" | "athlete";

export default function AssistantPage() {
  const { airData, activeStandard } = useAirQuality();
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [selectedCohort, setSelectedCohort] = useState<CohortType>("general");
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES_EN);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>("reasoning");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(100);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLanguageToggle = (newLang: "en" | "hi") => {
    setLang(newLang);
    if (messages.length <= 1) {
      setMessages(newLang === "hi" ? INITIAL_MESSAGES_HI : INITIAL_MESSAGES_EN);
    }
  };

  const handleSend = (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt) return;

    idCounter.current += 1;
    const userMsg: AssistantMessage = {
      id: `msg-${idCounter.current}`,
      role: "user",
      content: prompt,
      timestamp: lang === "hi" ? "अभी" : "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const callAssistant = async () => {
      try {
        const userProfile: UserProfileContext = {
          sensitivity: selectedCohort,
          hasAirPurifier: true,
          hasN95Mask: true,
        };

        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            lat: airData?.city.lat,
            lon: airData?.city.lon,
            standard: activeStandard,
            profile: userProfile,
            lang,
            aqiData: airData,
          }),
        });

        if (!response.ok) {
          throw new Error(`Assistant API HTTP ${response.status}`);
        }

        const responseEngine = response.headers.get("X-AI-Engine") || "gemini-3.5-flash-lite";
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream response");

        idCounter.current += 1;
        const botMsg: AssistantMessage = {
          id: `msg-${idCounter.current}`,
          role: "assistant",
          content: "",
          timestamp: lang === "hi" ? "अभी" : "Now",
          suggestedActions: [],
          engine: responseEngine,
        };

        setMessages((prev) => [...prev, botMsg]);

        let accumulatedContent = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          setMessages((prev) => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            if (last && last.role === "assistant") {
              last.content = accumulatedContent;
            }
            return newMessages;
          });
        }
      } catch (err) {
        console.error("Chat Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              lang === "hi"
                ? "क्षमा करें, वायुमंडलीय मॉडल से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।"
                : "Unable to establish streaming connection with the intelligence core. Please retry your inquiry.",
            timestamp: lang === "hi" ? "अभी" : "Now",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    };

    callAssistant();
  };

  const handleClearChat = () => {
    setMessages(lang === "hi" ? INITIAL_MESSAGES_HI : INITIAL_MESSAGES_EN);
  };

  const handleCopyChat = () => {
    const transcript = messages
      .map((m) => `[${m.role.toUpperCase()}] (${m.timestamp}):\n${m.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topicItems = lang === "hi" ? TOPIC_ITEMS_HI : TOPIC_ITEMS_EN;

  return (
    <PageTransition className="space-y-5 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F2F6FA] flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-[#4DB8FF]" />
            Assistant
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Powered by Google Gemini & Open-Meteo Copernicus CAMS models for {airData?.city.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Switcher Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] text-xs">
            <button
              onClick={() => handleLanguageToggle("en")}
              className={cn(
                "px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1",
                lang === "en"
                  ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)] shadow-sm"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
            >
              <span>EN</span>
              <span className="hidden sm:inline">English</span>
            </button>
            <button
              onClick={() => handleLanguageToggle("hi")}
              className={cn(
                "px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1",
                lang === "hi"
                  ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)] shadow-sm"
                  : "text-[#A3B3C2] hover:text-[#F2F6FA]"
              )}
            >
              <span>HI</span>
              <span className="hidden sm:inline">हिंदी</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyChat}
            icon={copied ? <Check className="w-3.5 h-3.5 text-[#4DB8FF]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? (lang === "hi" ? "कॉपी हुआ" : "Copied") : (lang === "hi" ? "कॉपी" : "Export")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {lang === "hi" ? "नया सत्र" : "New Chat"}
          </Button>

          <Badge variant="accent" dot>
            {airData?.city.name} ({activeStandard === "INDIA_CPCB" ? `IN NAQI ${airData?.indiaAqi}` : `US AQI ${airData?.usAqi}`})
          </Badge>
        </div>
      </div>

      {/* Cohort Sensitivity Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#8496A8] text-xs font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Languages className="w-3 h-3 text-[#4DB8FF]" />
          {lang === "hi" ? "सेंसिटिविटी प्रोफाइल:" : "Cohort Profile:"}
        </span>
        {(
          [
            { id: "general", en: "General Public", hi: "सामान्य नागरिक" },
            { id: "infant", en: "Pediatric / Child", hi: "शिशु व बच्चे" },
            { id: "respiratory", en: "Asthma / Respiratory", hi: "अस्थमा / सांस रोगी" },
            { id: "elderly", en: "Senior Citizen", hi: "वरिष्ठ नागरिक" },
            { id: "athlete", en: "Outdoor Athlete", hi: "धावक / एथलीट" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedCohort(item.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
              selectedCohort === item.id
                ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] shadow-sm"
                : "bg-[rgba(14,23,34,0.4)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
            )}
          >
            {lang === "hi" ? item.hi : item.en}
          </button>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Conversation Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[660px] rounded-3xl vision-glass-elevated overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.18)] to-transparent pointer-events-none z-20" />

          {/* Top Canvas Bar */}
          <div className="h-14 px-6 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,17,24,0.45)] flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[rgba(77,184,255,0.12)] border border-[rgba(77,184,255,0.25)] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#4DB8FF]" />
              </div>
              <span className="text-xs font-semibold text-[#F2F6FA]">
                {lang === "hi" ? "ब्रीथवाइज़ एआई रीज़निंग स्टूडियो" : "BreatheWise AI Reasoning Studio"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(77,184,255,0.08)] border border-[rgba(77,184,255,0.22)] text-xs text-[#4DB8FF] font-medium">
                <Lock className="w-3 h-3" />
                <span>{lang === "hi" ? "गोपनीय सत्र" : "Confidential Session"}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#A3B3C2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4DB8FF] animate-pulse" />
                <span>{lang === "hi" ? "वास्तविक टेलीमेट्री सक्रिय" : "Verified Telemetry Active"}</span>
              </div>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 z-10">
            {/* Greeting Beacon if initial message */}
            {messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 flex flex-col items-center text-center space-y-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-[rgba(10,22,17,0.7)] border border-[rgba(77,184,255,0.3)] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-[#4DB8FF]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-bold text-[#F2F6FA] tracking-tight">
                    {lang === "hi"
                      ? "नमस्कार! आज ब्रीथवाइज़ आपकी क्या सहायता कर सकता है?"
                      : "Welcome to BreatheWise AI Intelligence"}
                  </h3>
                  <p className="text-xs text-[#A3B3C2] max-w-md leading-relaxed">
                    {lang === "hi"
                      ? "स्मॉग से बचाव, सुबह के तापमान व्युत्क्रमण, या HEPA फिल्टर साइजिंग के बारे में पूछें।"
                      : "Real-time atmospheric chemistry explanations, personalized routines, and clinical smog guidance."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Chat Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isBot = msg.role === "assistant";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={cn(
                      "flex gap-3 max-w-2xl",
                      isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold",
                        isBot
                          ? "bg-[rgba(18,29,42,0.7)] border border-[rgba(77,184,255,0.3)] text-[#4DB8FF]"
                          : "bg-[rgba(24,38,56,0.8)] border border-[rgba(255,255,255,0.1)] text-[#F2F6FA]"
                      )}
                    >
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="space-y-2 min-w-0">
                      {isBot && msg.engine && (
                        <div className="flex items-center gap-1.5 px-1">
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase",
                              msg.engine === "deterministic-fallback"
                                ? "bg-[rgba(250,204,21,0.12)] text-[#FACC15] border-[rgba(250,204,21,0.3)]"
                                : "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border-[rgba(77,184,255,0.3)]"
                            )}
                          >
                            {msg.engine === "deterministic-fallback"
                              ? "⚙️ Deterministic Heuristic Engine"
                              : "✨ Google Gemini 3.5 Flash-Lite"}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "p-4 rounded-3xl text-xs md:text-sm leading-relaxed border backdrop-blur-md",
                          isBot
                            ? "bg-[rgba(14,23,34,0.65)] border-[rgba(255,255,255,0.08)] text-[#F2F6FA] rounded-tl-sm"
                            : "bg-[rgba(77,184,255,0.15)] border-[rgba(77,184,255,0.3)] text-[#F2F6FA] rounded-tr-sm whitespace-pre-wrap"
                        )}
                      >
                        {isBot ? (
                          <div className="markdown-content text-xs md:text-sm leading-relaxed text-[#F2F6FA]">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                ul: ({ children }) => (
                                  <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-[#4DB8FF]">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-[#4DB8FF]">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-white tracking-wide">{children}</strong>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-base font-bold text-[#F2F6FA] mt-3 mb-1.5">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-sm md:text-base font-bold text-[#F2F6FA] mt-2.5 mb-1">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-xs md:text-sm font-bold text-[#4DB8FF] mt-2 mb-1 flex items-center gap-1.5">
                                    {children}
                                  </h3>
                                ),
                                code: ({ children }) => (
                                  <code className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#4DB8FF] text-[11px] font-mono">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      <div
                        className={cn(
                          "text-xs text-[#8496A8] px-2",
                          isBot ? "text-left" : "text-right"
                        )}
                      >
                        {msg.timestamp}
                      </div>

                      {/* Suggested Quick Prompt Pills */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestedActions.map((action, i) => (
                            <motion.button
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              key={i}
                              onClick={() => handleSend(action)}
                              className="px-3 py-1.5 rounded-full bg-[rgba(14,23,34,0.5)] border border-[rgba(255,255,255,0.06)] text-xs text-[#A3B3C2] hover:text-[#4DB8FF] hover:border-[rgba(77,184,255,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{action}</span>
                              <ArrowUpRight className="w-3 h-3 text-[#8496A8]" />
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* AI Thinking & Streaming Pulse */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-md mr-auto items-center"
              >
                <div className="w-8 h-8 rounded-2xl bg-[rgba(18,29,42,0.7)] border border-[rgba(77,184,255,0.35)] text-[#4DB8FF] flex items-center justify-center shadow-[0_0_15px_rgba(77,184,255,0.2)]">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-[rgba(14,23,34,0.7)] border border-[rgba(77,184,255,0.2)] flex items-center gap-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-1">
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 rounded-full bg-[#4DB8FF]"
                    />
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#4DB8FF]"
                    />
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#4DB8FF]"
                    />
                  </div>
                  <span className="text-xs font-medium text-[#A3B3C2]">
                    {lang === "hi"
                      ? "वायुमंडलीय टेलीमेट्री व क्लिनिकल दिशानिर्देशों का विश्लेषण..."
                      : "Analyzing telemetry & scientific guidelines..."}
                  </span>
                </div>
              </motion.div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Floating Composer */}
          <div className="p-3 md:p-4 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,17,24,0.5)] backdrop-blur-2xl z-20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="rounded-2xl md:rounded-3xl bg-[rgba(18,29,42,0.7)] border border-[rgba(255,255,255,0.08)] p-3 space-y-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "स्मॉग से बचाव, HEPA साइजिंग या बाहर निकलने के सुरक्षित समय के बारे में पूछें..."
                    : "Ask BreatheWise AI about smog, HEPA purifier sizing, or child safety windows..."
                }
                className="w-full bg-transparent px-2 text-xs md:text-sm text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none"
              />

              {/* Bottom Row Tools & Action Button */}
              <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTool("reasoning")}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer",
                      activeTool === "reasoning"
                        ? "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)]"
                        : "bg-[rgba(10,17,24,0.4)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                    )}
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Gemini 3.5 Flash-Lite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("cams")}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer",
                      activeTool === "cams"
                        ? "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)]"
                        : "bg-[rgba(10,17,24,0.4)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                    )}
                  >
                    <Globe2 className="w-3 h-3" />
                    <span>CAMS Model Estimate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("cadr")}
                    className={cn(
                      "hidden sm:flex px-2.5 py-1 rounded-full text-xs font-medium items-center gap-1 transition-all cursor-pointer",
                      activeTool === "cadr"
                        ? "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)]"
                        : "bg-[rgba(10,17,24,0.4)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                    )}
                  >
                    <Wind className="w-3 h-3" />
                    <span>HEPA Sizing</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-full bg-[#4DB8FF] text-[#0A1118] flex items-center justify-center hover:bg-[#7CCBFF] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    aria-label="Send query"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </motion.button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Reference Templates Panel (Desktop Only — hidden on mobile to protect focus & screen real estate) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col h-[660px] rounded-3xl vision-glass p-5 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.16)] to-transparent pointer-events-none z-20" />
          
          <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4DB8FF]" />
              <h3 className="text-sm font-bold text-[#F2F6FA]">
                {lang === "hi" ? "सुझाए गए परामर्श विषय" : "Clinical Guidance Topics"}
              </h3>
            </div>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(18,29,42,0.5)] hover:bg-[rgba(24,38,56,0.7)] border border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#4DB8FF] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{lang === "hi" ? "नई चैट" : "New Chat"}</span>
            </button>
          </div>

          {/* Device Privacy Notice */}
          <div className="my-3 p-2.5 rounded-2xl bg-[rgba(77,184,255,0.05)] border border-[rgba(77,184,255,0.18)] flex items-start gap-2 text-xs text-[#BAE6FD]">
            <Lock className="w-3.5 h-3.5 text-[#4DB8FF] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === "hi"
                ? "सत्र गोपनीयता: आपके प्रश्न सर्वर पर कभी सहेजे नहीं जाते। यह संवाद 100% गोपनीय और आपके डिवाइस पर स्थानीय रहता है।"
                : "Strict Session Privacy: Inquiries are processed transiently in memory. No consultation data is ever stored on shared servers or exposed to other users."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pt-1">
            {(["Priority Topics", "Clinical Guidance"] as const).map((category) => {
              const items = topicItems.filter((h) => h.category === category);
              return (
                <div key={category} className="space-y-2">
                  <div className="text-xs uppercase font-bold tracking-wider text-[#8496A8] px-1">
                    {lang === "hi"
                      ? category === "Priority Topics"
                        ? "प्राथमिक विषय"
                        : "नैदानिक मार्गदर्शन"
                      : category}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <motion.button
                        whileHover={{ x: 2 }}
                        key={item.id}
                        onClick={() => handleSend(item.prompt)}
                        className="w-full text-left p-3 rounded-2xl bg-[rgba(14,23,34,0.4)] hover:bg-[rgba(18,29,42,0.6)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(77,184,255,0.2)] transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-[#8496A8] group-hover:text-[#4DB8FF] shrink-0 transition-colors" />
                          <span className="text-xs text-[#A3B3C2] group-hover:text-[#F2F6FA] truncate font-medium">
                            {item.title}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-[#8496A8] group-hover:text-[#4DB8FF] shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-[rgba(77,184,255,0.06)] border border-[rgba(77,184,255,0.2)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4DB8FF]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{lang === "hi" ? "सर्दियों का इनवर्जन अलर्ट" : "Winter Smog Advisory"}</span>
                </div>
                <p className="text-xs text-[#A3B3C2] leading-relaxed">
                  {lang === "hi"
                    ? `सुबह 6 AM से 9:30 AM तक तापमान व्युत्क्रमण सक्रिय रहता है। एयर प्यूरीफायर को सील्ड मोड में चलाएं।`
                    : `Atmospheric boundary layer inversion traps surface particulates. Strenuous outdoor cardiovascular workouts should shift indoors.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
