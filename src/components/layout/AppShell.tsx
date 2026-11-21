"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { AirQualityProvider } from "@/context/AirQualityContext";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AirQualityProvider>
      <div className="relative min-h-screen bg-[#0A1118] text-[#F2F6FA] flex flex-col justify-center p-0 md:p-3 lg:p-4 selection:bg-[#4DB8FF]/30 selection:text-[#4DB8FF] overflow-x-hidden">
        {/* Luminous, multi-layered atmospheric lighting backdrop (lightweight on mobile) */}
        <AmbientBackground />

        {/* Master Glass Chassis Container */}
        <div className="relative z-10 w-full max-w-[1600px] min-h-screen md:min-h-[96vh] mx-auto rounded-none md:rounded-[36px] bg-[rgba(14,23,34,0.92)] md:bg-[rgba(14,23,34,0.52)] md:backdrop-blur-3xl border-0 md:border md:border-[rgba(255,255,255,0.12)] shadow-none md:shadow-[0_32px_100px_-16px_rgba(0,0,0,0.92),inset_0_1.5px_0_0_rgba(255,255,255,0.24),inset_0_-1.5px_0_0_rgba(0,0,0,0.5)] flex flex-col lg:flex-row overflow-x-hidden">
          {/* Desktop Sidebar (Permanent column that never overlaps dashboard content) */}
          <Sidebar
            isOpen={false}
            onClose={() => {}}
          />

          {/* Main Workspace Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 lg:pb-0">
            <TopNav />
            <main className="flex-1 px-3 py-3 sm:px-4 md:px-6 md:py-4 max-w-[1560px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Modern Mobile Bottom Navigation Capsule with More Bottom Sheet */}
        <MobileBottomNav />
      </div>
    </AirQualityProvider>
  );
}
