"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HourlyAQIPoint } from "@/types/air-quality";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Activity, Clock, History, TrendingUp } from "lucide-react";
import { useAirQuality } from "@/context/AirQualityContext";

interface TrendChartProps {
  hourlyData?: HourlyAQIPoint[];
  historicalData?: HourlyAQIPoint[];
  forecastData?: HourlyAQIPoint[];
}

type TimeHorizon = "historical" | "forecast" | "combined";
type MetricType = "aqi" | "pm2_5" | "pm10" | "temperature" | "humidity";

export function TrendChart({
  hourlyData,
  historicalData = [],
  forecastData = [],
}: TrendChartProps) {
  const { activeStandard } = useAirQuality();
  const [horizon, setHorizon] = useState<TimeHorizon>("forecast");
  const [metric, setMetric] = useState<MetricType>("aqi");

  // Fallback if historicalData or forecastData are empty
  const hist = historicalData.length > 0 ? historicalData : [];
  const fore = forecastData.length > 0 ? forecastData : (hourlyData || []);

  let activeDataPoints: HourlyAQIPoint[] = [];
  if (horizon === "historical") {
    activeDataPoints = hist.length > 0 ? hist : fore.slice(0, 12);
  } else if (horizon === "forecast") {
    activeDataPoints = fore.slice(0, 24);
  } else {
    // Combined
    activeDataPoints = [...hist, ...fore.slice(0, 24)];
  }

  const isCpcb = activeStandard === "INDIA_CPCB";

  const formattedData = activeDataPoints.map((d) => {
    const aqiVal = isCpcb ? (d.indiaAqi ?? d.usAqi) : d.usAqi;
    return {
      displayTime: d.displayTime,
      fullTime: d.time,
      isHistorical: d.isHistorical ?? false,
      aqi: aqiVal,
      pm2_5: d.pm2_5,
      pm10: d.pm10,
      temperature: d.temperature ?? 18,
      humidity: d.humidity ?? 65,
    };
  });

  const getMetricLabel = () => {
    switch (metric) {
      case "aqi":
        return isCpcb ? "India CPCB NAQI" : "US EPA AQI";
      case "pm2_5":
        return "PM2.5 (µg/m³)";
      case "pm10":
        return "PM10 (µg/m³)";
      case "temperature":
        return "Temperature (°C)";
      case "humidity":
        return "Humidity (%)";
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case "aqi":
        return "#4DB8FF";
      case "pm2_5":
        return "#FF5C5C";
      case "pm10":
        return "#FFD23F";
      case "temperature":
        return "#4DB8FF";
      case "humidity":
        return "#A855F7";
    }
  };

  const activeColor = getMetricColor();

  return (
    <Card elevated className="p-5 md:p-6 space-y-4 rounded-3xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F2F6FA] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#4DB8FF]" />
            Atmospheric Dispersion & Trend Trajectory
          </h3>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
            {horizon === "historical"
              ? "Past 24-Hour Actual Assimilated Observations"
              : horizon === "forecast"
              ? "Next 24-Hour Numerical Model Smog Forecast"
              : "Continuous 48-Hour Historical & Forecast Timeline"}
          </p>
        </div>

        {/* Time Horizon Selector (Historical vs Forecast vs Combined) */}
        <div className="flex items-center gap-1 bg-[rgba(14,23,34,0.7)] p-1 rounded-full border border-[rgba(255,255,255,0.08)] backdrop-blur-md self-start sm:self-auto">
          <button
            onClick={() => setHorizon("historical")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              horizon === "historical"
                ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] shadow-sm"
                : "text-[#A3B3C2] hover:text-[#F2F6FA]"
            )}
          >
            <History className="w-3 h-3" />
            <span>Past 24h</span>
          </button>
          <button
            onClick={() => setHorizon("forecast")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              horizon === "forecast"
                ? "bg-[rgba(77,184,255,0.18)] text-[#4DB8FF] border border-[rgba(77,184,255,0.35)] shadow-sm"
                : "text-[#A3B3C2] hover:text-[#F2F6FA]"
            )}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Next 24h</span>
          </button>
          <button
            onClick={() => setHorizon("combined")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer hidden md:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              horizon === "combined"
                ? "bg-[rgba(199,125,255,0.18)] text-[#C77DFF] border border-[rgba(199,125,255,0.35)] shadow-sm"
                : "text-[#A3B3C2] hover:text-[#F2F6FA]"
            )}
          >
            Full 48h
          </button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[rgba(255,255,255,0.06)]">
        {(
          [
            { id: "aqi", label: isCpcb ? "India NAQI" : "US AQI" },
            { id: "pm2_5", label: "PM2.5" },
            { id: "pm10", label: "PM10" },
            { id: "temperature", label: "Temp (°C)" },
            { id: "humidity", label: "Humidity (%)" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMetric(tab.id)}
            className={cn(
              "px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]",
              metric === tab.id
                ? "bg-[rgba(255,255,255,0.1)] text-[#F2F6FA] border border-[rgba(255,255,255,0.2)] shadow-sm"
                : "text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.04)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recharts Area Container */}
      <div className="h-60 sm:h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayTime"
              stroke="#8496A8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.06)" }}
            />
            <YAxis
              stroke="#8496A8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.06)" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[rgba(18,29,42,0.96)] border border-[rgba(255,255,255,0.12)] p-2.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl space-y-1">
                      <div className="text-xs font-medium text-[#A3B3C2] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#4DB8FF]" />
                          <span>{item.displayTime}</span>
                        </div>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-semibold",
                            item.isHistorical
                              ? "bg-[rgba(77,184,255,0.15)] text-[#4DB8FF] border border-[rgba(77,184,255,0.3)]"
                              : "bg-[rgba(61,220,132,0.15)] text-[#3DDC84] border border-[rgba(61,220,132,0.3)]"
                          )}
                        >
                          {item.isHistorical ? "Station Historical" : "CAMS Model Forecast"}
                        </span>
                      </div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: activeColor }}
                      >
                        {getMetricLabel()}: {item[metric]}
                      </div>
                      <div className="text-xs text-[#8496A8] flex items-center gap-2">
                        <span>PM2.5: {item.pm2_5}</span>
                        <span>•</span>
                        <span>Temp: {item.temperature}°C</span>
                        <span>•</span>
                        <span>Hum: {item.humidity}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={activeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGradient)"
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
              style={{
                filter: `drop-shadow(0 4px 10px ${activeColor}55)`,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="sr-only" aria-live="polite">
          <p>
            {getMetricLabel()} trends for {horizon} horizon. Total {formattedData.length} data points available.
          </p>
          <table>
            <caption>Hourly {getMetricLabel()} values</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">{getMetricLabel()}</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.slice(0, 12).map((point, idx) => (
                <tr key={idx}>
                  <td>{point.displayTime}</td>
                  <td>{point[metric] ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
