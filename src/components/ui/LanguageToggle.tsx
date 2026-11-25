"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  lang: "en" | "hi";
  onChange: (lang: "en" | "hi") => void;
  showFullNames?: boolean;
}

/**
 * Shared bilingual (English / Hindi) capsule toggle button group.
 */
export function LanguageToggle({
  lang,
  onChange,
  showFullNames = false,
}: LanguageToggleProps) {
  const buttonClass = (active: boolean) =>
    cn(
      "px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1",
      active
        ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)] shadow-sm"
        : "text-[#A3B3C2] hover:text-[#F2F6FA]"
    );

  return (
    <div className="flex items-center p-0.5 rounded-full bg-[rgba(10,17,24,0.6)] border border-[rgba(255,255,255,0.08)] text-xs">
      <button type="button" onClick={() => onChange("en")} className={buttonClass(lang === "en")}>
        <span>EN</span>
        {showFullNames && <span className="hidden sm:inline">English</span>}
      </button>
      <button type="button" onClick={() => onChange("hi")} className={buttonClass(lang === "hi")}>
        <span>{showFullNames ? "HI" : "हिंदी"}</span>
        {showFullNames && <span className="hidden sm:inline">हिंदी</span>}
      </button>
    </div>
  );
}
