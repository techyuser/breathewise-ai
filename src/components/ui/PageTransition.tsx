"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();

  return (
    <div style={{ perspective: 1400 }} className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 16, z: -50, rotateX: 3.5, scale: 0.985 }
          }
          animate={{ opacity: 1, y: 0, z: 0, rotateX: 0, scale: 1 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -12, z: 40, rotateX: -2.5, scale: 1.01 }
          }
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformStyle: "preserve-3d" }}
          className={`smooth-144hz ${className || ""}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
