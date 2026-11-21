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
    "inline-flex items-center justify-center font-medium select-none disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden smooth-144hz cursor-pointer";

  const variantStyles = {
    primary:
      "bg-[#00D69A] text-[#05100C] font-bold hover:bg-[#05E5A6] shadow-[0_6px_24px_-2px_rgba(0,214,154,0.45),inset_0_1.5px_0_0_rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.25)] rounded-2xl",
    secondary:
      "bg-[rgba(14,32,24,0.65)] text-[#F5F8F6] hover:bg-[rgba(18,40,30,0.85)] border border-[rgba(255,255,255,0.12)] shadow-[0_6px_20px_-2px_rgba(0,0,0,0.45),inset_0_1.5px_0_0_rgba(255,255,255,0.18)] rounded-2xl backdrop-blur-2xl",
    outline:
      "bg-transparent text-[#F5F8F6] border border-[rgba(255,255,255,0.14)] hover:border-[rgba(0,214,154,0.45)] hover:text-[#00D69A] hover:bg-[rgba(0,214,154,0.08)] rounded-2xl backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    ghost:
      "bg-transparent text-[#98A9A1] hover:text-[#F5F8F6] hover:bg-[rgba(255,255,255,0.06)] rounded-2xl",
    danger:
      "bg-[rgba(248,113,113,0.18)] text-[#F87171] border border-[rgba(248,113,113,0.35)] hover:bg-[rgba(248,113,113,0.28)] rounded-2xl backdrop-blur-md shadow-[0_4px_16px_rgba(248,113,113,0.2)]",
    action:
      "w-10 h-10 rounded-full bg-[#00D69A] text-[#05100C] flex items-center justify-center shadow-[0_6px_24px_rgba(0,214,154,0.5),inset_0_1.5px_0_0_rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.3)] hover:bg-[#05E5A6]",
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
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        base,
        variantStyles[variant],
        variant !== "action" && sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {/* 3D Top Reflection Line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.35)] to-transparent pointer-events-none" />
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
