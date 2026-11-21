"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAirQuality } from "@/context/AirQualityContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Home,
  Footprints,
  Users,
  BotMessageSquare,
  Activity,
  Wind,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Air Quality",
    href: "/air-quality",
    icon: Wind,
  },
  {
    label: "Daily Planner",
    href: "/planner",
    icon: CalendarCheck,
  },
  {
    label: "Indoor Air",
    href: "/indoor",
    icon: Home,
  },
  {
    label: "Green Impact",
    href: "/impact",
    icon: Footprints,
  },
  {
    label: "Community",
    href: "/community",
    icon: Users,
  },
  {
    label: "Assistant",
    href: "/assistant",
    icon: BotMessageSquare,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { airData, activeStandard } = useAirQuality();

  const isCpcb = activeStandard === "INDIA_CPCB";
  const targetAqi = isCpcb ? airData?.indiaAqi : airData?.usAqi;
  const isSmogCritical =
    airData?.inversionRisk?.level === "High" ||
    airData?.inversionRisk?.level === "Extreme" ||
    (targetAqi !== null && targetAqi !== undefined && targetAqi > 200);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar: Clean, stable 240px column that never overlays or blocks page content */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 w-60 bg-[rgba(14,23,34,0.7)] backdrop-blur-2xl border-r border-[rgba(255,255,255,0.08)] overflow-hidden",
          isOpen ? "flex fixed inset-y-0 left-0 z-50 w-72" : ""
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 group w-full cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] rounded-2xl p-1"
            onClick={onClose}
            aria-label="BreatheWise Home"
          >
            {/* App Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4DB8FF] to-[#0284C7] p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <div className="w-full h-full bg-[#0A1118] rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#4DB8FF]" />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-[#F2F6FA]">
                BreatheWise
              </span>
              <span className="text-xs text-[#8496A8] font-normal whitespace-nowrap">
                Air Hygiene Platform
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smog Inversion Status Banner */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <Link
            href="/air-quality"
            onClick={onClose}
            className={cn(
              "w-full p-2.5 rounded-2xl border flex items-center justify-between transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              isSmogCritical
                ? "bg-[rgba(255,92,92,0.1)] border-[rgba(255,92,92,0.25)] text-[#FF5C5C]"
                : "bg-[rgba(61,220,132,0.08)] border-[rgba(61,220,132,0.2)] text-[#3DDC84]"
            )}
            title={isSmogCritical ? "Smog Inversion Risk Active" : "Atmospheric Grid Synchronized"}
            aria-label={isSmogCritical ? "Smog Inversion Risk Active" : "Atmospheric Grid Synchronized"}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isSmogCritical ? "bg-[#FF5C5C]" : "bg-[#3DDC84]"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isSmogCritical ? "bg-[#FF5C5C]" : "bg-[#3DDC84]"
                  )}
                />
              </span>

              <span className="text-xs font-medium text-[#F2F6FA] whitespace-nowrap">
                {isSmogCritical ? "Inversion Risk" : "Grid Synchronized"}
              </span>
            </div>

            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                isSmogCritical
                  ? "bg-[rgba(255,92,92,0.15)] text-[#FF5C5C] border-[rgba(255,92,92,0.3)]"
                  : "bg-[rgba(61,220,132,0.12)] text-[#3DDC84] border-[rgba(61,220,132,0.25)]"
              )}
            >
              {isCpcb ? `NAQI ${airData?.indiaAqi ?? "--"}` : `AQI ${airData?.usAqi ?? "--"}`}
            </span>
          </Link>
        </div>

        {/* Clean, single-line Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
                  isActive
                    ? "text-[#4DB8FF] font-semibold"
                    : "text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.04)]"
                )}
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                    className="absolute inset-0 bg-[rgba(77,184,255,0.12)] border border-[rgba(77,184,255,0.25)] rounded-xl pointer-events-none"
                  />
                )}

                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors relative z-10",
                    isActive ? "text-[#4DB8FF]" : "text-[#8496A8] group-hover:text-[#F2F6FA]"
                  )}
                />

                <span className="relative z-10 whitespace-nowrap text-xs">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
