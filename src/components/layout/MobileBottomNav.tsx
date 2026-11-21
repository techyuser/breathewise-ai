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
      color: "text-[#00D69A]",
      badge: "Calculator",
    },
    {
      label: "Community Watch",
      description: "Report localized smoke & view radar heatmap",
      href: "/community",
      icon: Users,
      color: "text-[#38BDF8]",
      badge: "Crowdsourced",
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on desktop lg) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[rgba(7,16,12,0.96)] border-t border-[rgba(255,255,255,0.12)] px-2 py-1 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl">
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
                  "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative",
                  isActive ? "text-[#00D69A]" : "text-[#98A9A1] hover:text-[#F5F8F6]"
                )}
              >
                {item.highlight && !isActive && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#00D69A] animate-ping" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "text-[#00D69A] scale-110" : "text-[#98A9A1]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] mt-0.5 leading-none transition-colors",
                    isActive ? "font-bold text-[#00D69A]" : "font-medium text-[#98A9A1]"
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
              "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative",
              moreOpen || pathname === "/impact" || pathname === "/community"
                ? "text-[#00D69A]"
                : "text-[#98A9A1] hover:text-[#F5F8F6]"
            )}
            aria-label="Open more options"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium leading-none">More</span>
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
              className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-[rgba(9,20,16,0.98)] border-t border-[rgba(255,255,255,0.15)] rounded-t-3xl shadow-[0_-16px_48px_rgba(0,0,0,0.9)] p-4 pb-8 space-y-4 max-w-lg mx-auto"
            >
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F8F6]">More Features & Standards</h3>
                  <p className="text-[11px] text-[#98A9A1]">Quick navigation and atmospheric settings</p>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#98A9A1] hover:text-[#F5F8F6]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Standard Switcher Segment */}
              <div className="p-3 rounded-2xl bg-[rgba(6,14,11,0.7)] border border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#F5F8F6]">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#00D69A]" />
                    AQI Calculation Standard
                  </span>
                  <span className="text-[10px] text-[#00D69A]">
                    {isCpcb ? "India CPCB" : "US EPA"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAqiStandard("INDIA_CPCB")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      isCpcb
                        ? "bg-[rgba(0,214,154,0.18)] border-[#00D69A] text-[#00D69A]"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#98A9A1]"
                    )}
                  >
                    {isCpcb && <Check className="w-3.5 h-3.5" />}
                    <span>India CPCB NAQI</span>
                  </button>
                  <button
                    onClick={() => setAqiStandard("US_EPA")}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      !isCpcb
                        ? "bg-[rgba(56,189,248,0.18)] border-[#38BDF8] text-[#38BDF8]"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#98A9A1]"
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
                        "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                        isActive
                          ? "bg-[rgba(0,214,154,0.14)] border-[#00D69A]"
                          : "bg-[rgba(12,24,19,0.7)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(16,32,25,0.9)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                          <Icon className={cn("w-5 h-5", item.color)} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F5F8F6]">{item.label}</div>
                          <div className="text-[10px] text-[#98A9A1]">{item.description}</div>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#98A9A1] border border-[rgba(255,255,255,0.08)]">
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
