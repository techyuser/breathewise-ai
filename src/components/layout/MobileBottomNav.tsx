"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wind,
  CalendarClock,
  Sparkles,
  Home,
  Menu,
  X,
  Leaf,
  Users,
  Check,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAirQuality } from "@/context/AirQualityContext";
import { motion, AnimatePresence } from "motion/react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { activeStandard, setAqiStandard } = useAirQuality();
  const [moreOpen, setMoreOpen] = useState(false);

  const isCpcb = activeStandard === "INDIA_CPCB";

  const primaryNavItems = [
    {
      label: "Overview",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Pollutants",
      href: "/air-quality",
      icon: Wind,
    },
    {
      label: "Planner",
      href: "/planner",
      icon: CalendarClock,
    },
    {
      label: "Assistant",
      href: "/assistant",
      icon: Sparkles,
      highlight: true,
    },
    {
      label: "Indoor",
      href: "/indoor",
      icon: Home,
    },
  ];

  const moreItems = [
    {
      label: "Green Impact",
      description: "Commute mode & tailpipe carbon savings",
      href: "/impact",
      icon: Leaf,
      color: "text-[#3DDC84]",
      badge: "Calculator",
    },
    {
      label: "Community Watch",
      description: "Report localized smoke & view radar heatmap",
      href: "/community",
      icon: Users,
      color: "text-[#4DB8FF]",
      badge: "Crowdsourced",
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on desktop lg) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[rgba(14,23,34,0.96)] border-t border-[rgba(255,255,255,0.12)] px-2 py-1 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                  isActive ? "text-[#4DB8FF]" : "text-[#A3B3C2] hover:text-[#F2F6FA]"
                )}
                aria-label={item.label}
              >
                {item.highlight && !isActive && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#4DB8FF] animate-ping" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "text-[#4DB8FF] scale-110" : "text-[#A3B3C2]"
                  )}
                />
                <span
                  className={cn(
                    "text-xs mt-0.5 leading-none transition-colors",
                    isActive ? "font-bold text-[#4DB8FF]" : "font-medium text-[#A3B3C2]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              moreOpen || pathname === "/impact" || pathname === "/community"
                ? "text-[#4DB8FF]"
                : "text-[#A3B3C2] hover:text-[#F2F6FA]"
            )}
            aria-label="Open more options"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs mt-0.5 font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* Modern Native-Style Bottom Sheet for "More" */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-[rgba(14,23,34,0.98)] border-t border-[rgba(255,255,255,0.15)] rounded-t-3xl shadow-[0_-16px_48px_rgba(0,0,0,0.9)] p-4 pb-8 space-y-4 max-w-lg mx-auto"
            >
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F2F6FA]">More Features & Standards</h3>
                  <p className="text-xs text-[#A3B3C2]">Quick navigation and atmospheric settings</p>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#A3B3C2] hover:text-[#F2F6FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                  aria-label="Close bottom sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Standard Switcher Segment */}
              <div className="p-3 rounded-2xl bg-[rgba(10,17,24,0.7)] border border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#F2F6FA]">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#4DB8FF]" />
                    AQI Calculation Standard
                  </span>
                  <span className="text-xs text-[#4DB8FF]">
                    {isCpcb ? "India CPCB" : "US EPA"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAqiStandard("INDIA_CPCB")}
                    aria-pressed={isCpcb}
                    aria-label="Switch to India CPCB NAQI standard"
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                      isCpcb
                        ? "bg-[rgba(77,184,255,0.18)] border-[#4DB8FF] text-[#4DB8FF]"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#A3B3C2]"
                    )}
                  >
                    {isCpcb && <Check className="w-3.5 h-3.5" />}
                    <span>India CPCB NAQI</span>
                  </button>
                  <button
                    onClick={() => setAqiStandard("US_EPA")}
                    aria-pressed={!isCpcb}
                    aria-label="Switch to US EPA AQI standard"
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                      !isCpcb
                        ? "bg-[rgba(77,184,255,0.18)] border-[#4DB8FF] text-[#4DB8FF]"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#A3B3C2]"
                    )}
                  >
                    {!isCpcb && <Check className="w-3.5 h-3.5" />}
                    <span>US EPA AQI</span>
                  </button>
                </div>
              </div>

              {/* More Navigation Links */}
              <div className="space-y-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                        isActive
                          ? "bg-[rgba(77,184,255,0.14)] border-[#4DB8FF]"
                          : "bg-[rgba(18,29,42,0.7)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(24,38,56,0.9)]"
                      )}
                      aria-label={item.label}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                          <Icon className={cn("w-5 h-5", item.color)} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F2F6FA]">{item.label}</div>
                          <div className="text-xs text-[#A3B3C2]">{item.description}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#A3B3C2] border border-[rgba(255,255,255,0.08)]">
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
