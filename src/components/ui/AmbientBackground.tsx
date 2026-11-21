import React from "react";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Base Deep Forest Charcoal Foundation */}
      <div className="absolute inset-0 bg-[#050E0A]" />

      {/* Lightweight, zero-lag CSS gradient on mobile */}
      <div className="absolute inset-0 md:hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,214,154,0.18)_0%,transparent_70%)]" />

      {/* Atmospheric Vertical 3D Light Columns (Desktop only to guarantee 120FPS on mobile) */}
      <div className="hidden md:block absolute top-[-100px] left-[12%] w-[480px] h-[135%] bg-gradient-to-b from-[rgba(0,214,154,0.20)] via-[rgba(0,214,154,0.06)] to-transparent blur-[85px] transform -rotate-12 pointer-events-none" />
      <div className="hidden md:block absolute top-[-80px] right-[15%] w-[520px] h-[135%] bg-gradient-to-b from-[rgba(0,214,154,0.16)] via-[rgba(56,189,248,0.09)] to-transparent blur-[95px] transform rotate-12 pointer-events-none" />

      {/* Primary Center Luminous Halo behind the top dashboard */}
      <div className="hidden md:block absolute top-[-70px] left-1/2 -translate-x-1/2 w-[920px] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,214,154,0.22)_0%,rgba(56,189,248,0.08)_42%,transparent_72%)] blur-[85px] pointer-events-none" />

      {/* Mid & Lower Volumetric Depth Orbs */}
      <div className="hidden md:block absolute top-[38%] left-[6%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,214,154,0.12)_0%,transparent_70%)] blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-[-100px] right-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,214,154,0.14)_0%,rgba(56,189,248,0.06)_50%,transparent_70%)] blur-[105px] pointer-events-none" />

      {/* Dynamic 3D Vignette Edge */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,7,5,0.78)_100%)] pointer-events-none" />
    </div>
  );
}
