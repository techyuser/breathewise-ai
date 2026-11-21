"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wind,
  CalendarClock,
  Home,
  Leaf,
  Users,
  Sparkles,
  Activity,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useAirQuality } from "@/context/AirQualityContext";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    label: "Overview",
    description: "Live Smog Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Air Quality",
    description: "6-Pollutant Matrix",
    href: "/air-quality",
    icon: Wind,
    badge: "Modelled",
  },
  {
    label: "AI Daily Planner",
    description: "Diurnal Smog Plan",
    href: "/planner",
    icon: CalendarClock,
    badge: "AI",
  },
  {
    label: "Indoor Air",
    description: "CADR & Filter Life",
    href: "/indoor",
    icon: Home,
    badge: null,
  },
  {
    label: "Green Impact",
    description: "Commute & Carbon",
    href: "/impact",
    icon: Leaf,
    badge: null,
  },
  {
    label: "Community",
    description: "Smoke Watch & Hubs",
    href: "/community",
    icon: Users,
    badge: "Reports",
  },
  {
    label: "AI Assistant",
    description: "GenAI Health Guard",
    href: "/assistant",
    icon: Sparkles,
    badge: "GenAI",
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { airData } = useAirQuality();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = useRef<NodeJS.Timeout | null>(null);

  const isExpanded = isHovered || isPinned || isOpen;
  const isSmogCritical = (airData?.usAqi ?? 0) > 150;

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 45);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoveredItem(null);
    leaveTimer.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container — Subtle Minimal VisionOS Drawer (295px expanded, 76px collapsed) */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 295 : 76,
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 28,
          mass: 0.6,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden lg:flex lg:absolute lg:top-0 lg:bottom-0 lg:left-0 lg:z-40 bg-[rgba(7,16,12,0.75)] backdrop-blur-3xl border-r border-[rgba(255,255,255,0.12)] flex-col shrink-0 smooth-144hz overflow-hidden",
          isExpanded ? "shadow-[0_24px_80px_rgba(0,0,0,0.95)] border-r-[rgba(0,214,154,0.3)]" : ""
        )}
      >
        {/* Brand Header — Single Clean Logo Badge */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 group w-full cursor-pointer select-none"
            onClick={onClose}
          >
            {/* Single App Logo Badge (w-11 h-11 rounded-2xl) */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00D69A] to-[#008A63] p-0.5 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(0,214,154,0.35)] group-hover:shadow-[0_0_26px_rgba(0,214,154,0.5)] transition-shadow">
              <div className="w-full h-full bg-[#07100D] rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#00D69A] group-hover:scale-105 transition-transform" />
              </div>
            </div>

            {/* Title on Expansion */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col min-w-0 overflow-visible"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="font-bold text-sm tracking-tight text-[#F5F8F6]">
                      BreatheWise
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[rgba(0,214,154,0.15)] text-[#00D69A] border border-[rgba(0,214,154,0.3)]">
                      AI
                    </span>
                  </div>
                  <span className="text-[10px] text-[#98A9A1] font-normal whitespace-nowrap -mt-0.5">
                    Winter Smog Intelligence
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smog Status Indicator */}
        <div className="px-3 pt-3 pb-1 shrink-0 flex items-center justify-center">
          <Link
            href="/air-quality"
            onClick={onClose}
            className={cn(
              "rounded-2xl border flex items-center transition-all group overflow-hidden cursor-pointer",
              isExpanded
                ? "w-full p-2.5 justify-between"
                : "w-11 h-11 justify-center",
              isSmogCritical
                ? "bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.3)] text-[#F87171]"
                : "bg-[rgba(12,24,19,0.5)] border-[rgba(255,255,255,0.06)] text-[#00D69A]"
            )}
            title={isSmogCritical ? "Smog Inversion Risk Active" : "Atmospheric Grid Synchronized"}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isSmogCritical ? "bg-[#F87171]" : "bg-[#00D69A]"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isSmogCritical ? "bg-[#F87171]" : "bg-[#00D69A]"
                  )}
                />
              </span>

              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-medium text-[#F5F8F6] whitespace-nowrap"
                >
                  {isSmogCritical ? "Inversion Risk" : "Atmospheric Grid"}
                </motion.span>
              )}
            </div>

            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                  isSmogCritical
                    ? "bg-[rgba(248,113,113,0.15)] text-[#F87171] border-[rgba(248,113,113,0.3)]"
                    : "bg-[rgba(0,214,154,0.15)] text-[#00D69A] border-[rgba(0,214,154,0.3)]"
                )}
              >
                AQI {airData?.usAqi ?? "--"}
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation Item Dock */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden flex flex-col items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <div
                key={item.href}
                className="relative w-full flex items-center justify-center group"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center rounded-2xl text-xs font-medium transition-all group cursor-pointer",
                    isExpanded
                      ? "w-full px-3.5 py-2.5 justify-between"
                      : "w-11 h-11 justify-center",
                    isActive
                      ? "text-[#00D69A] font-semibold"
                      : "text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.04)]"
                  )}
                >
                  {/* Subtle active pill indicator with Framer Motion layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                      className="absolute inset-0 bg-[rgba(0,214,154,0.12)] border border-[rgba(0,214,154,0.35)] rounded-2xl shadow-[0_0_16px_rgba(0,214,154,0.18)] pointer-events-none"
                    />
                  )}

                  <div className="flex items-center gap-3 relative z-10 min-w-0">
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-[#00D69A]" : "text-[#98A9A1] group-hover:text-[#F5F8F6]"
                      )}
                    />

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col min-w-0 overflow-visible"
                      >
                        <span className="whitespace-nowrap font-medium text-xs text-[#F5F8F6]">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[#64786E] whitespace-nowrap font-normal">
                          {item.description}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {isExpanded && item.badge && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 shrink-0 ml-2"
                    >
                      <Badge
                        variant={isActive ? "accent" : "subtle"}
                        size="sm"
                        className="text-[9px] px-1.5 py-0 whitespace-nowrap"
                      >
                        {item.badge}
                      </Badge>
                    </motion.span>
                  )}
                </Link>

                {/* Floating Tooltip in collapsed dock mode */}
                <AnimatePresence>
                  {!isExpanded && hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -6, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -6, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      className="hidden lg:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 items-center pointer-events-none"
                    >
                      <div className="bg-[rgba(9,18,14,0.96)] border border-[rgba(255,255,255,0.12)] p-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7)] backdrop-blur-2xl whitespace-nowrap space-y-0.5">
                        <div className="text-xs font-semibold text-[#F5F8F6] flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[rgba(0,214,154,0.15)] text-[#00D69A] border border-[rgba(0,214,154,0.3)]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#00D69A] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D69A]" />
                          <span>{item.description}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer: Pin Lock Toggle */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] hidden lg:flex items-center justify-center shrink-0">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="w-full h-8 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center gap-2 text-[#98A9A1] hover:text-[#F5F8F6] transition-colors cursor-pointer text-xs"
            title={isPinned ? "Unlock auto-collapse" : "Lock sidebar open"}
            aria-label={isPinned ? "Unlock auto-collapse" : "Lock sidebar open"}
          >
            {isPinned ? (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-[#00D69A]" />
                <span className="text-[10px] font-medium">Locked</span>
              </>
            ) : isExpanded ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#98A9A1]" />
                <span className="text-[10px] font-medium">Pin Open</span>
              </>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#98A9A1]" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
