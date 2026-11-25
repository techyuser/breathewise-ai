export interface CommunityAlert {
  id: string;
  type:
    | "Biomass Burning"
    | "Construction Dust"
    | "Severe Smog Pocket"
    | "Industrial Smoke"
    | "Traffic Gridlock";
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

export const INITIAL_ALERTS: CommunityAlert[] = [
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

export const INITIAL_CHALLENGES: CommunityChallenge[] = [
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

export const CLEAN_AIR_REFUGES: CleanAirRefuge[] = [
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
