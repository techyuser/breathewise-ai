"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Award } from "lucide-react";
import type { CommunityChallenge } from "@/components/community/community-data";

interface ChallengesTabProps {
  challenges: CommunityChallenge[];
  onToggleJoin: (id: string) => void;
  onMarkMilestone: (id: string) => void;
}

/**
 * Community clean-air initiatives grid with participation counters and milestone progression.
 */
export function ChallengesTab({
  challenges,
  onToggleJoin,
  onMarkMilestone,
}: ChallengesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#F2F6FA] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FACC15]" />
            Clean Air Community Awareness Challenges
          </h3>
          <p className="text-xs text-[#A3B3C2] mt-0.5">
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
                <span className="text-xs font-bold text-[#4DB8FF]">+{ch.rewardPoints} Pts</span>
              </div>

              <h4 className="text-sm font-bold text-[#F2F6FA] leading-snug">{ch.title}</h4>
              <p className="text-xs text-[#A3B3C2] leading-relaxed">{ch.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#A3B3C2]">
                  <span>{ch.participants} Citizens Joined</span>
                  <span className="font-semibold text-[#F2F6FA]">{ch.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4DB8FF] rounded-full transition-all"
                    style={{ width: `${ch.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={ch.joined ? "outline" : "primary"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onToggleJoin(ch.id)}
                >
                  {ch.joined ? "Leave" : "Join Challenge"}
                </Button>
                {ch.joined && !ch.completed && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => onMarkMilestone(ch.id)}
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
  );
}
