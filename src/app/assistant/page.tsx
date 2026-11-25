"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAirQuality } from "@/context/AirQualityContext";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ChatMessageList } from "@/components/assistant/ChatMessageList";
import { TopicsSidebar } from "@/components/assistant/TopicsSidebar";
import {
  COHORT_OPTIONS,
  CohortType,
  INITIAL_MESSAGES_EN,
  INITIAL_MESSAGES_HI,
  TOPIC_ITEMS_EN,
  TOPIC_ITEMS_HI,
} from "@/components/assistant/assistant-constants";
import {
  Sparkles,
  Send,
  Bot,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  Globe2,
  Wind,
  Languages,
  Lock,
} from "lucide-react";
import { AssistantMessage, UserProfileContext } from "@/lib/gemini";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

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

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt) return;

    idCounter.current += 1;
    const userMsg: AssistantMessage = {
      id: `msg-${idCounter.current}`,
      role: "user",
      content: prompt,
      timestamp: lang === "hi" ? "अभी" : "Now",
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsTyping(true);

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
          messages: nextHistory,
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
      const botId = `msg-${idCounter.current}`;
      const botMsg: AssistantMessage = {
        id: botId,
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
        accumulatedContent += decoder.decode(value, { stream: true });

        // Immutable state update preserves strict React 19 pure rendering
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: accumulatedContent } : m))
        );
      }
    } catch (err) {
      logger.error("AssistantPage", err);
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

  const toolButtons = [
    { id: "reasoning", label: "Gemini 3.5 Flash-Lite", icon: Cpu, hideOnMobile: false },
    { id: "cams", label: "CAMS Model Estimate", icon: Globe2, hideOnMobile: false },
    { id: "cadr", label: "HEPA Sizing", icon: Wind, hideOnMobile: true },
  ];

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
          <LanguageToggle lang={lang} onChange={handleLanguageToggle} showFullNames />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyChat}
            icon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-[#4DB8FF]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )
            }
          >
            {copied ? (lang === "hi" ? "कॉपी हुआ" : "Copied") : lang === "hi" ? "कॉपी" : "Export"}
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
            {airData?.city.name} (
            {activeStandard === "INDIA_CPCB" ? `IN NAQI ${airData?.indiaAqi}` : `US AQI ${airData?.usAqi}`})
          </Badge>
        </div>
      </div>

      {/* Cohort Sensitivity Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#8496A8] text-xs font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Languages className="w-3 h-3 text-[#4DB8FF]" />
          {lang === "hi" ? "सेंसिटिविटी प्रोफाइल:" : "Cohort Profile:"}
        </span>
        {COHORT_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
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
        <div className="lg:col-span-8 flex flex-col h-[660px] rounded-3xl vision-glass-elevated overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.18)] to-transparent pointer-events-none z-20" />

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

          <ChatMessageList
            messages={messages}
            isTyping={isTyping}
            lang={lang}
            onSelectSuggestion={(action) => handleSend(action)}
            bottomRef={chatBottomRef}
          />

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
                aria-label={
                  lang === "hi"
                    ? "वायु गुणवत्ता परामर्श प्रश्न पूछें"
                    : "Ask BreatheWise AI about air quality and smog"
                }
                placeholder={
                  lang === "hi"
                    ? "स्मॉग से बचाव, HEPA साइजिंग या बाहर निकलने के सुरक्षित समय के बारे में पूछें..."
                    : "Ask BreatheWise AI about smog, HEPA purifier sizing, or child safety windows..."
                }
                className="w-full bg-transparent px-2 text-xs md:text-sm text-[#F2F6FA] placeholder:text-[#8496A8] focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {toolButtons.map(({ id, label, icon: Icon, hideOnMobile }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTool(id)}
                      className={cn(
                        hideOnMobile ? "hidden sm:flex" : "flex",
                        "px-2.5 py-1 rounded-full text-xs font-medium items-center gap-1 transition-all cursor-pointer",
                        activeTool === id
                          ? "bg-[rgba(77,184,255,0.12)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)]"
                          : "bg-[rgba(10,17,24,0.4)] text-[#A3B3C2] hover:text-[#F2F6FA] border border-[rgba(255,255,255,0.06)]"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

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
            </form>
          </div>
        </div>

        <TopicsSidebar
          lang={lang}
          topicItems={topicItems}
          onClearChat={handleClearChat}
          onSelectTopic={(prompt) => handleSend(prompt)}
        />
      </div>
    </PageTransition>
  );
}
