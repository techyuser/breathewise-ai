import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0A1118",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "BreatheWise AI | Urban Air Quality & Winter Smog Assistant",
  description:
    "A premium GenAI-powered application designed for families and communities to navigate urban air pollution, smog inversion, and respiratory hazards.",
  keywords: [
    "Air Quality",
    "AQI",
    "India CPCB NAQI",
    "US EPA NowCast",
    "Winter Smog",
    "Thermal Inversion",
    "Google Gemini",
    "Clean Air",
    "Respiratory Health",
  ],
  authors: [{ name: "BreatheWise AI Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon" },
    ],
  },
  openGraph: {
    title: "BreatheWise AI | Urban Air Quality & Winter Smog Assistant",
    description: "Next-generation urban air intelligence, clinical diurnal inversion mitigation, and community resilience.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-[#0A1118] text-[#F2F6FA] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
