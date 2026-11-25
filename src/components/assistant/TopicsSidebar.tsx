"use client";

import React from "react";
import { motion } from "motion/react";
import { Sparkles, Plus, Lock, Clock, ArrowUpRight, ShieldAlert } from "lucide-react";
import type { ChatTopicItem } from "@/components/assistant/assistant-constants";

interface TopicsSidebarProps {
  lang: "en" | "hi";
  topicItems: ChatTopicItem[];
  onClearChat: () => void;
  onSelectTopic: (prompt: string) => void;
}

/**
 * Desktop sidebar housing privacy assurance, curated clinical inquiry presets,
 * and winter boundary-layer inversion notices.
 */
export function TopicsSidebar({
  lang,
  topicItems,
  onClearChat,
  onSelectTopic,
}: TopicsSidebarProps) {
  return (
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
          type="button"
          onClick={onClearChat}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(18,29,42,0.5)] hover:bg-[rgba(24,38,56,0.7)] border border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#4DB8FF] transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>{lang === "hi" ? "नई चैट" : "New Chat"}</span>
        </button>
      </div>

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
          const headingLabel =
            lang === "hi"
              ? category === "Priority Topics"
                ? "प्राथमिक विषय"
                : "नैदानिक मार्गदर्शन"
              : category;

          return (
            <div key={category} className="space-y-2">
              <div className="text-xs uppercase font-bold tracking-wider text-[#8496A8] px-1">
                {headingLabel}
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <motion.button
                    whileHover={{ x: 2 }}
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTopic(item.prompt)}
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
                ? "सुबह 6 AM से 9:30 AM तक तापमान व्युत्क्रमण सक्रिय रहता है। एयर प्यूरीफायर को सील्ड मोड में चलाएं।"
                : "Atmospheric boundary layer inversion traps surface particulates. Strenuous outdoor cardiovascular workouts should shift indoors."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
