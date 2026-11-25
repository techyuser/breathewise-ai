"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, User, Sparkles, ArrowUpRight } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/lib/gemini";

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-2 pl-4 list-disc marker:text-[#4DB8FF]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-[#4DB8FF]">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white tracking-wide">{children}</strong>
  ),
  h1: ({ children }) => <h1 className="text-base font-bold text-[#F2F6FA] mt-3 mb-1.5">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-sm md:text-base font-bold text-[#F2F6FA] mt-2.5 mb-1">{children}</h2>
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
};

interface ChatMessageListProps {
  messages: AssistantMessage[];
  isTyping: boolean;
  lang: "en" | "hi";
  onSelectSuggestion: (prompt: string) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Scrollable conversation stream rendering greeting banner, markdown assistant replies,
 * quick suggestion pills, and streaming typing indicator.
 */
export function ChatMessageList({
  messages,
  isTyping,
  lang,
  onSelectSuggestion,
  bottomRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 z-10">
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
                      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                <div className={cn("text-xs text-[#8496A8] px-2", isBot ? "text-left" : "text-right")}>
                  {msg.timestamp}
                </div>

                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        key={i}
                        type="button"
                        onClick={() => onSelectSuggestion(action)}
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
              {[0, 0.15, 0.3].map((delay) => (
                <motion.span
                  key={delay}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay }}
                  className="w-1.5 h-1.5 rounded-full bg-[#4DB8FF]"
                />
              ))}
            </div>
            <span className="text-xs font-medium text-[#A3B3C2]">
              {lang === "hi"
                ? "वायुमंडलीय टेलीमेट्री व क्लिनिकल दिशानिर्देशों का विश्लेषण..."
                : "Analyzing telemetry & scientific guidelines..."}
            </span>
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
