"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "action";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium select-none disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden smooth-144hz cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DB8FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1118]";

  const variantStyles = {
    primary:
      "bg-[#4DB8FF] text-[#0A1118] font-bold hover:bg-[#7CCBFF] shadow-[0_6px_24px_-2px_rgba(77,184,255,0.45),inset_0_1.5px_0_0_rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.25)] rounded-2xl",
    secondary:
      "bg-[rgba(18,29,42,0.65)] text-[#F2F6FA] hover:bg-[rgba(24,38,56,0.85)] border border-[rgba(255,255,255,0.12)] shadow-[0_6px_20px_-2px_rgba(0,0,0,0.45),inset_0_1.5px_0_0_rgba(255,255,255,0.18)] rounded-2xl backdrop-blur-2xl",
    outline:
      "bg-transparent text-[#F2F6FA] border border-[rgba(255,255,255,0.14)] hover:border-[rgba(77,184,255,0.45)] hover:text-[#4DB8FF] hover:bg-[rgba(77,184,255,0.08)] rounded-2xl backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    ghost:
      "bg-transparent text-[#A3B3C2] hover:text-[#F2F6FA] hover:bg-[rgba(255,255,255,0.06)] rounded-2xl",
    danger:
      "bg-[rgba(255,92,92,0.18)] text-[#FF5C5C] border border-[rgba(255,92,92,0.35)] hover:bg-[rgba(255,92,92,0.28)] rounded-2xl backdrop-blur-md shadow-[0_4px_16px_rgba(255,92,92,0.2)] focus-visible:ring-[#FF5C5C]",
    action:
      "w-10 h-10 rounded-full bg-[#4DB8FF] text-[#0A1118] flex items-center justify-center shadow-[0_6px_24px_rgba(77,184,255,0.5),inset_0_1.5px_0_0_rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.3)] hover:bg-[#7CCBFF]",
  };

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-xs md:text-sm px-4.5 py-2.5 gap-2",
    lg: "text-sm md:text-base px-6 py-3 gap-2.5",
    icon: "p-2 w-9 h-9 rounded-2xl",
  };

  return (
    <motion.button
      whileHover={
        disabled
          ? undefined
          : {
              y: -2,
              scale: 1.02,
              transition: { type: "spring", stiffness: 450, damping: 20 },
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              y: 1.5,
              scale: 0.96,
              transition: { duration: 0.08 },
            }
      }
      className={cn(base, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
