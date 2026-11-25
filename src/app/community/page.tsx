"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReportPollutionModal } from "@/components/community/ReportPollutionModal";
import { AlertsFeedTab } from "@/components/community/AlertsFeedTab";
import { RadarHotspotMap } from "@/components/community/RadarHotspotMap";
import { ChallengesTab } from "@/components/community/ChallengesTab";
import {
  CLEAN_AIR_REFUGES,
  CleanAirRefuge,
  CommunityAlert,
  CommunityChallenge,
  INITIAL_ALERTS,
  INITIAL_CHALLENGES,
} from "@/components/community/community-data";
import { useAirQuality } from "@/context/AirQualityContext";
import { readStorageJson, writeStorageJson } from "@/lib/storage";
import { AlertTriangle, PlusCircle, Users, Award, Map } from "lucide-react";

const ALERTS_STORAGE_KEY = "breathewise_community_alerts_v2";
const CHALLENGES_STORAGE_KEY = "breathewise_community_challenges_v2";

export default function CommunityPage() {
  const { selectedCity } = useAirQuality();

  const [alerts, setAlerts] = useState<CommunityAlert[]>(() =>
    readStorageJson(ALERTS_STORAGE_KEY, INITIAL_ALERTS)
  );
  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() =>
    readStorageJson(CHALLENGES_STORAGE_KEY, INITIAL_CHALLENGES)
  );

  const [filterType, setFilterType] = useState<string>("All");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "map" | "challenges">("alerts");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState<CommunityAlert["type"]>("Biomass Burning");
  const [formSeverity, setFormSeverity] = useState<CommunityAlert["severity"]>("High");
  const [formDesc, setFormDesc] = useState("");
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const saveAlerts = (nextAlerts: CommunityAlert[]) => {
    setAlerts(nextAlerts);
    writeStorageJson(ALERTS_STORAGE_KEY, nextAlerts);
  };

  const handleVerify = (id: string) => {
    const updated = alerts.map((a) =>
      a.id === id
        ? {
            ...a,
            verifiedByUser: !a.verifiedByUser,
            verifications: a.verifiedByUser ? a.verifications - 1 : a.verifications + 1,
          }
        : a
    );
    saveAlerts(updated);
  };

  const handleDetectGps = () => {
    const fallback = `${selectedCity.name} Urban Perimeter`;
    if (!navigator.geolocation) {
      setFormLocation(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLocation(
          `Sector near ${selectedCity.name} (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        );
      },
      () => setFormLocation(fallback)
    );
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocation.trim() || !formDesc.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newAlert: CommunityAlert = {
        id: `alert-${Date.now()}`,
        type: formType,
        location: formLocation.trim(),
        description: formDesc.trim(),
        severity: formSeverity,
        distance: "0.4 km away (Current Zone)",
        timeAgo: "Just now",
        verifications: 1,
        verifiedByUser: true,
        hasPhoto: Boolean(formPhoto),
      };

      saveAlerts([newAlert, ...alerts]);
      setIsSubmitting(false);
      setSubmitSuccess(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        setReportModalOpen(false);
        setFormLocation("");
        setFormDesc("");
        setFormPhoto(null);
      }, 1400);
    }, 600);
  };

  const toggleChallengeJoin = (id: string) => {
    setChallenges((prev) => {
      const updated = prev.map((ch) =>
        ch.id === id
          ? {
              ...ch,
              joined: !ch.joined,
              participants: ch.joined ? ch.participants - 1 : ch.participants + 1,
            }
          : ch
      );
      writeStorageJson(CHALLENGES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const markChallengeMilestone = (id: string) => {
    setChallenges((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id !== id) return ch;
        const nextProgress = Math.min(100, ch.progressPercent + 30);
        return { ...ch, progressPercent: nextProgress, completed: nextProgress >= 100 };
      });
      writeStorageJson(CHALLENGES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const handleCopyShelter = (refuge: CleanAirRefuge) => {
    navigator.clipboard.writeText(`${refuge.name}, ${refuge.address}`);
    setCopiedId(refuge.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAlerts =
    filterType === "All" ? alerts : alerts.filter((a) => a.type === filterType);

  return (
    <PageTransition className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(77,184,255,0.08)] border border-[rgba(77,184,255,0.2)] text-xs font-semibold text-[#4DB8FF] mb-1.5">
            <Users className="w-3 h-3" />
            Citizen Mesh Observation Network
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F6FA]">
            Community Smoke Watch & Clean Refuges
          </h1>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            Real-time citizen-reported smoke hazards, community challenges, and verified low-AQI municipal refuges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4 text-[#0A1118]" />}
            onClick={() => setReportModalOpen(true)}
          >
            Report Pollution
          </Button>
          <Badge variant="warning" dot>
            {alerts.length} Active Observations
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
        {[
          { id: "alerts", label: "Citizen Smoke Feed", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { id: "map", label: "Radar Hotspot Map", icon: <Map className="w-3.5 h-3.5" /> },
          { id: "challenges", label: "Community Challenges", icon: <Award className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#4DB8FF] text-[#0A1118] shadow-sm"
                : "text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.05)]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "alerts" && (
        <AlertsFeedTab
          alerts={alerts}
          filteredAlerts={filteredAlerts}
          filterType={filterType}
          copiedId={copiedId}
          refuges={CLEAN_AIR_REFUGES}
          onFilterChange={setFilterType}
          onVerifyAlert={handleVerify}
          onCopyRefuge={handleCopyShelter}
        />
      )}

      {activeTab === "map" && <RadarHotspotMap selectedCity={selectedCity} alerts={alerts} />}

      {activeTab === "challenges" && (
        <ChallengesTab
          challenges={challenges}
          onToggleJoin={toggleChallengeJoin}
          onMarkMilestone={markChallengeMilestone}
        />
      )}

      <ReportPollutionModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formType={formType}
        setFormType={setFormType}
        formSeverity={formSeverity}
        setFormSeverity={setFormSeverity}
        formDesc={formDesc}
        setFormDesc={setFormDesc}
        formPhoto={formPhoto}
        setFormPhoto={setFormPhoto}
        onDetectGps={handleDetectGps}
        onSubmit={handleSubmitReport}
        submitSuccess={submitSuccess}
        isSubmitting={isSubmitting}
      />
    </PageTransition>
  );
}
