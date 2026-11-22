"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCityName: string;
  isHighSmog: boolean;
  mounted: boolean;
}

/**
 * Emergency Smog Shield Countermeasures Modal rendered via React Portal.
 */
export function EmergencyShieldModal({
  isOpen,
  onClose,
  selectedCityName,
  isHighSmog,
  mounted,
}: EmergencyShieldModalProps) {
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[rgba(18,29,42,0.98)] border border-[rgba(255,255,255,0.16)] rounded-3xl p-6 shadow-[0_32px_100px_rgba(0,0,0,0.9),inset_0_1.5px_0_0_rgba(255,255,255,0.25)] space-y-4 backdrop-blur-3xl m-auto"
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#4DB8FF]" />
                <h3 className="text-base font-bold text-[#F2F6FA]">
                  Active Protection Protocol
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#A3B3C2]">
              <p>
                Current modeled atmospheric parameters for{" "}
                <strong className="text-[#F2F6FA]">{selectedCityName}</strong> indicate{" "}
                <span
                  className={cn(
                    "font-semibold",
                    isHighSmog ? "text-[#FF5C5C]" : "text-[#3DDC84]"
                  )}
                >
                  {isHighSmog
                    ? "elevated winter smog trap"
                    : "nominal ambient ventilation"}
                </span>
                .
              </p>
              <div className="p-3.5 rounded-2xl bg-[rgba(14,23,34,0.7)] border border-[rgba(255,255,255,0.08)] space-y-1.5">
                <div className="font-semibold text-[#F2F6FA]">Recommended Countermeasures:</div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>N95 / FFP2 respirator for outdoor intervals</li>
                  <li>Indoor recirculating HEPA filtration active</li>
                  <li>Avoid morning hours (6:00 AM – 9:00 AM) near arterial roads</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#4DB8FF] text-[#0A1118] text-xs font-bold hover:bg-[#7CCBFF] transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF]"
            >
              Acknowledge Protocol
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
