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
    default: "bg-[#183329] text-[#98A9A1] border-[#224436]",
    accent: "bg-[rgba(0,214,154,0.12)] text-[#00D69A] border-[rgba(0,214,154,0.25)]",
    warning: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]",
    danger: "bg-[rgba(255,90,95,0.12)] text-[#FF5A5F] border-[rgba(255,90,95,0.25)]",
    outline: "bg-transparent text-[#98A9A1] border-[rgba(255,255,255,0.12)]",
    subtle: "bg-[rgba(255,255,255,0.04)] text-[#F5F8F6] border-transparent",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
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
              ? "bg-[#00D69A]"
              : variant === "danger"
              ? "bg-[#FF5A5F]"
              : variant === "warning"
              ? "bg-[#F59E0B]"
              : "bg-[#98A9A1]"
          )}
        />
      )}
      {children}
    </span>
  );
}
