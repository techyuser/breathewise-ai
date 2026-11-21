"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAirQuality } from "@/context/AirQualityContext";
import {
  AlertTriangle,
  MapPin,
  Building,
  PlusCircle,
  Copy,
  Check,
  Users,
  Compass,
  Camera,
  Award,
  ThumbsUp,
  Map,
  X,
  Radio,
  CheckCircle2,
} from "lucide-react";

export interface CommunityAlert {
  id: string;
  type: "Biomass Burning" | "Construction Dust" | "Severe Smog Pocket" | "Industrial Smoke" | "Traffic Gridlock";
  location: string;
  description: string;
  severity: "Moderate" | "High" | "Severe";
  distance: string;
  timeAgo: string;
  verifications: number;
  verifiedByUser?: boolean;
  hasPhoto?: boolean;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  rewardPoints: number;
  participants: number;
  progressPercent: number;
  joined: boolean;
  completed: boolean;
  description: string;
}

export interface CleanAirRefuge {
  id: string;
  name: string;
  address: string;
  facilityType: "Public Library" | "Underground Transit" | "Community Center";
  indoorAqi: number;
  openHours: string;
}

const INITIAL_ALERTS: CommunityAlert[] = [
  {
    id: "alert-1",
    type: "Biomass Burning",
    location: "East Ring Road near Sector 4 Outer Ring",
    description: "Open leaves and municipal waste burning along highway service lane.",
    severity: "Severe",
    distance: "1.2 km away",
    timeAgo: "15 mins ago",
    verifications: 18,
    verifiedByUser: false,
    hasPhoto: true,
  },
  {
    id: "alert-2",
    type: "Construction Dust",
    location: "Metro Station North Concourse",
    description: "Uncovered fly ash transport and unpaved excavation without water sprinkling.",
    severity: "High",
    distance: "2.4 km away",
    timeAgo: "45 mins ago",
    verifications: 32,
    verifiedByUser: false,
    hasPhoto: false,
  },
  {
    id: "alert-3",
    type: "Severe Smog Pocket",
    location: "Underpass Valley Ring Highway",
    description: "Thermal inversion pooling heavy vehicular exhaust in depressed underpass.",
    severity: "High",
    distance: "3.1 km away",
    timeAgo: "1 hour ago",
    verifications: 47,
    verifiedByUser: false,
    hasPhoto: true,
  },
];

const INITIAL_CHALLENGES: CommunityChallenge[] = [
  {
    id: "ch-1",
    title: "Zero Engine Idling School Zone",
    rewardPoints: 150,
    participants: 412,
    progressPercent: 70,
    joined: true,
    completed: false,
    description: "Commit to switching off vehicle ignition while waiting outside schools or intersections.",
  },
  {
    id: "ch-2",
    title: "5-Day Clean Metro Commuter",
    rewardPoints: 200,
    participants: 890,
    progressPercent: 100,
    joined: true,
    completed: true,
    description: "Replace private car rides with electric rapid transit for 5 consecutive work days.",
  },
  {
    id: "ch-3",
    title: "Active Smoke Sentinel",
    rewardPoints: 120,
    participants: 284,
    progressPercent: 40,
    joined: false,
    completed: false,
    description: "Spot, photo-verify, and geo-tag an illegal open burning incident for municipal dispatch.",
  },
];

const REFUGES: CleanAirRefuge[] = [
  {
    id: "ref-1",
    name: "Central Civic Library (HEPA Verified)",
    address: "Civic Plaza, Core Block 3",
    facilityType: "Public Library",
    indoorAqi: 24,
    openHours: "08:00 AM - 08:00 PM",
  },
  {
    id: "ref-2",
    name: "Underground Metro Interconnect Concourse",
    address: "Line 2 Central Interchange",
    facilityType: "Underground Transit",
    indoorAqi: 38,
    openHours: "24/7 Access",
  },
  {
    id: "ref-3",
    name: "Community Health Wellness Centre",
    address: "Sector 9 Park Road",
    facilityType: "Community Center",
    indoorAqi: 19,
    openHours: "09:00 AM - 06:00 PM",
  },
];

export default function CommunityPage() {
  const { selectedCity } = useAirQuality();

  const [alerts, setAlerts] = useState<CommunityAlert[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedAlerts = localStorage.getItem("breathewise_community_alerts_v2");
        if (savedAlerts) return JSON.parse(savedAlerts);
      } catch {
        // ignore
      }
    }
    return INITIAL_ALERTS;
  });

  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedChallenges = localStorage.getItem("breathewise_community_challenges_v2");
        if (savedChallenges) return JSON.parse(savedChallenges);
      } catch {
        // ignore
      }
    }
    return INITIAL_CHALLENGES;
  });

  const [filterType, setFilterType] = useState<string>("All");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "map" | "challenges">("alerts");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState<CommunityAlert["type"]>("Biomass Burning");
  const [formSeverity, setFormSeverity] = useState<CommunityAlert["severity"]>("High");
  const [formDesc, setFormDesc] = useState("");
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const saveAlerts = (newAlerts: CommunityAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("breathewise_community_alerts_v2", JSON.stringify(newAlerts));
    } catch {
      // ignore
    }
  };

  const handleVerify = (id: string) => {
    const updated = alerts.map((a) => {
      if (a.id === id) {
        const isVerified = a.verifiedByUser;
        return {
          ...a,
          verifiedByUser: !isVerified,
          verifications: isVerified ? a.verifications - 1 : a.verifications + 1,
        };
      }
      return a;
    });
    saveAlerts(updated);
  };

  const handleDetectGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormLocation(
            `Sector near ${selectedCity.name} (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          );
        },
        () => {
          setFormLocation(`${selectedCity.name} Urban Perimeter`);
        }
      );
    } else {
      setFormLocation(`${selectedCity.name} Urban Perimeter`);
    }
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
        hasPhoto: !!formPhoto,
      };

      const updated = [newAlert, ...alerts];
      saveAlerts(updated);
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
      const updated = prev.map((ch) => {
        if (ch.id === id) {
          const nextJoined = !ch.joined;
          return {
            ...ch,
            joined: nextJoined,
            participants: nextJoined ? ch.participants + 1 : ch.participants - 1,
          };
        }
        return ch;
      });
      try {
        localStorage.setItem("breathewise_community_challenges_v2", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const markChallengeMilestone = (id: string) => {
    setChallenges((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id === id) {
          const nextProgress = ch.progressPercent >= 100 ? 100 : ch.progressPercent + 30;
          return {
            ...ch,
            progressPercent: nextProgress,
            completed: nextProgress >= 100,
          };
        }
        return ch;
      });
      try {
        localStorage.setItem("breathewise_community_challenges_v2", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleCopyShelter = (refuge: CleanAirRefuge) => {
    navigator.clipboard.writeText(`${refuge.name}, ${refuge.address}`);
    setCopiedId(refuge.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAlerts = alerts.filter((a) =>
    filterType === "All" ? true : a.type === filterType
  );

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(0,214,154,0.08)] border border-[rgba(0,214,154,0.2)] text-[11px] font-semibold text-[#00D69A] mb-1.5">
            <Users className="w-3 h-3" />
            Citizen Mesh Observation Network
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F8F6]">
            Community Smoke Watch & Clean Refuges
          </h1>
          <p className="text-xs text-[#98A9A1] mt-0.5">
            Real-time citizen-reported smoke hazards, community challenges, and verified low-AQI municipal refuges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4 text-[#07100D]" />}
            onClick={() => setReportModalOpen(true)}
          >
            Report Pollution
          </Button>
          <Badge variant="warning" dot>
            {alerts.length} Active Observations
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
        {[
          { id: "alerts", label: "Citizen Smoke Feed", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { id: "map", label: "Radar Hotspot Map", icon: <Map className="w-3.5 h-3.5" /> },
          { id: "challenges", label: "Community Challenges", icon: <Award className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#00D69A] text-[#07100D] shadow-sm"
                : "text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.05)]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: CITIZEN SMOKE FEED */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Alerts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-semibold tracking-wider text-[#98A9A1] uppercase flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#FACC15] animate-pulse" />
                Live Incident Stream ({filteredAlerts.length})
              </h3>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {["All", "Biomass Burning", "Construction Dust", "Severe Smog Pocket"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      filterType === cat
                        ? "bg-[rgba(0,214,154,0.2)] text-[#00D69A] border border-[rgba(0,214,154,0.35)] font-semibold"
                        : "bg-[rgba(10,20,16,0.5)] text-[#98A9A1] hover:text-[#F5F8F6] border border-[rgba(255,255,255,0.06)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  elevated
                  className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            alert.severity === "Severe"
                              ? "danger"
                              : alert.severity === "High"
                              ? "warning"
                              : "subtle"
                          }
                          size="sm"
                          className="text-[10px]"
                        >
                          {alert.type}
                        </Badge>
                        <span className="text-[11px] text-[#64786E]">•</span>
                        <span className="text-[11px] text-[#98A9A1]">{alert.timeAgo}</span>
                        <span className="text-[11px] text-[#64786E]">•</span>
                        <span className="text-[11px] text-[#00D69A]">{alert.distance}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#F5F8F6] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                        {alert.location}
                      </h4>
                    </div>

                    {/* Upvote / Verification Button */}
                    <button
                      onClick={() => handleVerify(alert.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        alert.verifiedByUser
                          ? "bg-[rgba(0,214,154,0.2)] border-[#00D69A] text-[#00D69A]"
                          : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.08)]"
                      }`}
                      title="Verify this observation"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{alert.verifications}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#98A9A1] leading-relaxed">
                    {alert.description}
                  </p>

                  {alert.hasPhoto && (
                    <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-[11px] text-[#64786E]">
                      <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Citizen attached photo verification telemetry</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Right Col: Clean Refuges */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-[#98A9A1] uppercase flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#00D69A]" />
                Verified Clean Air Refuges
              </h3>
              <Badge variant="accent" size="sm">
                HEPA Safe
              </Badge>
            </div>

            <div className="space-y-3">
              {REFUGES.map((refuge) => (
                <Card
                  key={refuge.id}
                  elevated
                  className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F8F6]">
                        {refuge.name}
                      </h4>
                      <p className="text-[11px] text-[#98A9A1] mt-0.5">
                        {refuge.address}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-[#00D69A]">
                        {refuge.indoorAqi}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-[#64786E]">
                        Indoor AQI
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.06)] text-[11px]">
                    <span className="text-[#64786E]">{refuge.openHours}</span>
                    <button
                      onClick={() => handleCopyShelter(refuge)}
                      className="text-xs font-semibold text-[#00D69A] hover:text-[#05E5A6] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === refuge.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#00D69A]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RADAR HOTSPOT MAP */}
      {activeTab === "map" && (
        <Card elevated className="p-5 md:p-6 rounded-3xl space-y-4 border border-[rgba(0,214,154,0.2)] bg-[rgba(9,18,14,0.8)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#F5F8F6] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00D69A]" />
                Micro-Climate Hotspot Radar: {selectedCity.name}
              </h3>
              <p className="text-xs text-[#98A9A1] mt-0.5">
                Spatial distribution of citizen-reported plumes and sensor cross-correlations
              </p>
            </div>
            <Badge variant="subtle" size="sm">
              Coordinates: {selectedCity.lat.toFixed(2)}°N, {selectedCity.lon.toFixed(2)}°E
            </Badge>
          </div>

          {/* Interactive Radar Visual Canvas */}
          <div className="relative w-full h-80 rounded-2xl bg-[rgba(6,14,11,0.95)] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
            {/* Concentric Radar Rings */}
            <div className="absolute w-72 h-72 rounded-full border border-[rgba(0,214,154,0.15)] pointer-events-none" />
            <div className="absolute w-48 h-48 rounded-full border border-[rgba(0,214,154,0.2)] pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full border border-[rgba(0,214,154,0.3)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,214,154,0.06)_0%,transparent_75%)] pointer-events-none" />

            {/* Crosshairs */}
            <div className="absolute w-full h-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />
            <div className="absolute h-full w-px bg-[rgba(255,255,255,0.08)] pointer-events-none" />

            {/* Center Pin: Current User */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-[#00D69A] border-2 border-white shadow-[0_0_16px_#00D69A] animate-ping" />
              <span className="text-[10px] font-bold text-[#F5F8F6] bg-[rgba(0,0,0,0.7)] px-2 py-0.5 rounded-full mt-1 border border-[rgba(255,255,255,0.1)]">
                You ({selectedCity.name})
              </span>
            </div>

            {/* Hotspot Pins */}
            {alerts.map((item, idx) => {
              const offsets = [
                { top: "25%", left: "68%" },
                { top: "65%", left: "32%" },
                { top: "35%", left: "28%" },
                { top: "72%", left: "75%" },
              ];
              const pos = offsets[idx % offsets.length];
              return (
                <div
                  key={item.id}
                  className="absolute cursor-pointer group z-20"
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() =>
                    window.alert(
                      `Selected hotspot: ${item.location}\nType: ${item.type}\nSeverity: ${item.severity}`
                    )
                  }
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-transform group-hover:scale-125 ${
                      item.severity === "Severe"
                        ? "bg-[#F87171] border-white shadow-[0_0_12px_#F87171]"
                        : "bg-[#FACC15] border-white shadow-[0_0_12px_#FACC15]"
                    }`}
                  />
                  <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[rgba(10,22,17,0.95)] border border-[rgba(255,255,255,0.2)] rounded-xl px-2.5 py-1 text-[10px] text-[#F5F8F6] shadow-xl z-30">
                    <span className="font-bold">{item.type}</span>: {item.location}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#98A9A1] pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                <span>Severe Smog / Fire</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                <span>Construction Dust</span>
              </span>
            </div>
            <span>Click any marker to inspect incident metadata</span>
          </div>
        </Card>
      )}

      {/* TAB 3: COMMUNITY CHALLENGES */}
      {activeTab === "challenges" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#F5F8F6] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FACC15]" />
                Clean Air Community Awareness Challenges
              </h3>
              <p className="text-xs text-[#98A9A1] mt-0.5">
                Join collective citizen initiatives to reduce neighborhood smog plumes and earn Clean Air Points.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch) => (
              <Card
                key={ch.id}
                elevated
                className="p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,18,14,0.7)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={ch.completed ? "accent" : ch.joined ? "subtle" : "outline"} size="sm">
                      {ch.completed ? "Completed" : ch.joined ? "Active" : "Open"}
                    </Badge>
                    <span className="text-xs font-bold text-[#00D69A]">
                      +{ch.rewardPoints} Pts
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#F5F8F6] leading-snug">
                    {ch.title}
                  </h4>
                  <p className="text-xs text-[#98A9A1] leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#98A9A1]">
                      <span>{ch.participants} Citizens Joined</span>
                      <span className="font-semibold text-[#F5F8F6]">{ch.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00D69A] rounded-full transition-all"
                        style={{ width: `${ch.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={ch.joined ? "outline" : "primary"}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => toggleChallengeJoin(ch.id)}
                    >
                      {ch.joined ? "Leave" : "Join Challenge"}
                    </Button>
                    {ch.joined && !ch.completed && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs shrink-0"
                        onClick={() => markChallengeMilestone(ch.id)}
                        title="Mark progress milestone"
                      >
                        +30%
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Report Pollution Modal Form */}
      <AnimatePresence>
        {reportModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setReportModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.16)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FACC15]" />
                  <h3 className="text-base font-bold text-[#F5F8F6]">
                    Report Environmental Pollution Incident
                  </h3>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 rounded-lg text-[#98A9A1] hover:text-[#F5F8F6] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Location Input with GPS Detect Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#98A9A1]">
                      Incident Location / Landmark
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      className="text-[11px] font-semibold text-[#00D69A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      Detect GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ring Road service lane near Sector 12"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2.5 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                  />
                </div>

                {/* Category & Severity Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#98A9A1]">
                      Pollution Category
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as CommunityAlert["type"])}
                      className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                    >
                      <option value="Biomass Burning">Biomass / Garbage Burning</option>
                      <option value="Construction Dust">Construction Dust Plume</option>
                      <option value="Severe Smog Pocket">Severe Smog Pocket</option>
                      <option value="Industrial Smoke">Industrial Stack Smoke</option>
                      <option value="Traffic Gridlock">Severe Traffic Gridlock</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#98A9A1]">
                      Severity Level
                    </label>
                    <select
                      value={formSeverity}
                      onChange={(e) => setFormSeverity(e.target.value as CommunityAlert["severity"])}
                      className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                    >
                      <option value="Moderate">Moderate Issue</option>
                      <option value="High">High Smoke / Dust</option>
                      <option value="Severe">Severe Hazard / Stifling</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#98A9A1]">
                    Detailed Observation Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe source, wind direction, visible smoke density, or ongoing construction activities..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-[rgba(14,28,22,0.9)] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-xs text-[#F5F8F6] outline-none focus:border-[#00D69A]"
                  />
                </div>

                {/* Simulated Photo Attachment */}
                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#98A9A1]">
                    <Camera className="w-4 h-4 text-[#38BDF8]" />
                    <span>{formPhoto ? "Photo Attached (1 file)" : "Attach Photo Evidence (Optional)"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormPhoto(formPhoto ? null : "photo_simulated.jpg")}
                    className="text-xs font-semibold text-[#00D69A] hover:underline cursor-pointer"
                  >
                    {formPhoto ? "Remove" : "Simulate Upload"}
                  </button>
                </div>

                {submitSuccess ? (
                  <div className="p-3 rounded-xl bg-[rgba(0,214,154,0.15)] border border-[#00D69A] text-xs font-bold text-[#00D69A] text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Incident successfully logged to Citizen Mesh!</span>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Broadcasting Observation..." : "Submit Incident Report"}
                  </Button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
