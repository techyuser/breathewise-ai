"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { AirQualityProvider } from "@/context/AirQualityContext";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AirQualityProvider>
      <div className="relative min-h-screen bg-[#050E0A] text-[#F5F8F6] flex flex-col justify-center p-0 md:p-3 lg:p-4 selection:bg-[#00D69A]/30 selection:text-[#00D69A]">
        {/* Luminous, multi-layered atmospheric lighting backdrop for deep glass refraction */}
        <AmbientBackground />

        {/* Master 3D Frosted Glass Chassis Container */}
        <div className="relative z-10 w-full max-w-[1600px] min-h-screen md:min-h-[96vh] mx-auto rounded-none md:rounded-[36px] bg-[rgba(9,20,16,0.52)] backdrop-blur-3xl border-0 md:border md:border-[rgba(255,255,255,0.13)] shadow-[0_32px_100px_-16px_rgba(0,0,0,0.92),inset_0_1.5px_0_0_rgba(255,255,255,0.24),inset_0_-1.5px_0_0_rgba(0,0,0,0.5)] flex flex-col lg:flex-row overflow-hidden">
          {/* Desktop Left Rail Spacer — Keeps main dashboard width rock-solid on hover */}
          <div className="hidden lg:block w-[76px] shrink-0 pointer-events-none" />

          {/* Sidebar (Fixed icon dock that expands smoothly as a floating visionOS glass overlay on hover) */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Workspace Area — 100% Stable Width, Never Squeezed or Jittered */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <TopNav onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
            <main className="flex-1 px-4 py-3 md:px-6 md:py-4 max-w-[1560px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AirQualityProvider>
  );
}
