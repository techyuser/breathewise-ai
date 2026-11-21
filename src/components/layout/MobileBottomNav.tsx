"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wind,
  CalendarClock,
  Sparkles,
  Home,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
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

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[rgba(8,18,14,0.96)] border-t border-[rgba(255,255,255,0.1)] px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative",
                isActive ? "text-[#00D69A]" : "text-[#98A9A1] hover:text-[#F5F8F6]"
              )}
            >
              {item.highlight && !isActive && (
                <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#00D69A] animate-ping" />
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

        {/* More / Menu Drawer Button */}
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#98A9A1] hover:text-[#F5F8F6] transition-colors cursor-pointer"
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
