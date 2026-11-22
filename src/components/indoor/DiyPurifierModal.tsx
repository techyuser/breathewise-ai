"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { BudgetRecommendation } from "@/lib/intelligence/indoor-assessment";

interface DiyPurifierModalProps {
  activeDiyModal: BudgetRecommendation | null;
  onClose: () => void;
}

/**
 * Step-by-step DIY Air Purifier and low-cost filtration construction guide modal.
 */
export function DiyPurifierModal({
  activeDiyModal,
  onClose,
}: DiyPurifierModalProps) {
  return (
    <AnimatePresence>
      {activeDiyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[rgba(9,18,14,0.98)] border border-[rgba(255,255,255,0.15)] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div>
                <Badge variant="accent" size="sm" className="mb-1 text-xs">
                  {activeDiyModal.costLabel}
                </Badge>
                <h3 className="text-base font-bold text-[#F2F6FA]">
                  {activeDiyModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close guide modal"
                className="p-1 rounded-lg text-[#A3B3C2] hover:text-[#F2F6FA] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[rgba(77,184,255,0.08)] border border-[rgba(77,184,255,0.2)] text-xs text-[#4DB8FF] font-semibold">
              Expected Clean Air Impact: {activeDiyModal.impactReduction}
            </div>

            <div className="text-xs text-[#A3B3C2] space-y-2 whitespace-pre-line leading-relaxed">
              {activeDiyModal.diyGuide}
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={onClose}
            >
              Close Guide
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
