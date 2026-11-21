import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "warning" | "danger" | "outline" | "subtle";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
  dot = false,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#182638] text-[#A3B3C2] border-[#22354A]",
    accent: "bg-[rgba(77,184,255,0.14)] text-[#4DB8FF] border-[rgba(77,184,255,0.3)]",
    warning: "bg-[rgba(255,210,63,0.14)] text-[#FFD23F] border-[rgba(255,210,63,0.3)]",
    danger: "bg-[rgba(255,92,92,0.14)] text-[#FF5C5C] border-[rgba(255,92,92,0.3)]",
    outline: "bg-transparent text-[#A3B3C2] border-[rgba(255,255,255,0.12)]",
    subtle: "bg-[rgba(255,255,255,0.06)] text-[#F2F6FA] border-transparent",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            variant === "accent"
              ? "bg-[#4DB8FF]"
              : variant === "danger"
              ? "bg-[#FF5C5C]"
              : variant === "warning"
              ? "bg-[#FFD23F]"
              : "bg-[#A3B3C2]"
          )}
        />
      )}
      {children}
    </span>
  );
}
