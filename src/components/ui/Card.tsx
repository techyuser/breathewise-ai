"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  HTMLMotionProps,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  glow?: boolean;
  interactive?: boolean;
  elevated?: boolean;
  tilt3d?: boolean;
  hoverEffect?: boolean;
  variant?: "default" | "elevated" | "subtle";
}

export function Card({
  children,
  className,
  glow = false,
  interactive = false,
  elevated = false,
  tilt3d = false,
  hoverEffect = false,
  variant = "default",
  style,
  ...props
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        typeof window !== "undefined" &&
          (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches)
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 3D Spatial Cursor Tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 26 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 26 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [2.5, -2.5]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-2.5, 2.5]);

  // Dynamic 3D Cursor-Tracking Specular Light Sheen (refined, subtle)
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["15%", "85%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["15%", "85%"]);
  const glareBackground = useMotionTemplate`radial-gradient(circle 320px at ${glareX} ${glareY}, rgba(255, 255, 255, 0.08), transparent 70%)`;

  // Tilt and glare effect is strictly for hero-card only (Rule 7)
  const is3DActive = !isMobile && Boolean(tilt3d) && !shouldReduceMotion;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const effectiveVariant = elevated ? "elevated" : variant;
  const variantClass =
    effectiveVariant === "elevated"
      ? "vision-glass-elevated"
      : effectiveVariant === "subtle"
      ? "glass-panel-subtle"
      : interactive
      ? "glass-card-interactive"
      : "vision-glass";

  return (
    <div style={{ perspective: is3DActive ? 1200 : undefined }} className="h-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={
          is3DActive
            ? {
                y: -2,
                scale: 1.005,
                transition: { type: "spring", stiffness: 380, damping: 24 },
              }
            : undefined
        }
        whileTap={
          interactive
            ? {
                scale: 0.985,
                transition: { duration: 0.1 },
              }
            : undefined
        }
        style={{
          rotateX: is3DActive ? rotateX : 0,
          rotateY: is3DActive ? rotateY : 0,
          transformStyle: is3DActive ? "preserve-3d" : undefined,
          ...style,
        }}
        className={cn(
          "rounded-2xl p-5 md:p-6 relative overflow-hidden smooth-144hz group cursor-default select-none",
          variantClass,
          (interactive || hoverEffect) && "card-hover cursor-pointer",
          glow && "ambient-glow-emerald",
          className
        )}
        {...props}
      >
        {/* Dynamic Specular Sheen (Subtle, Hero only) */}
        {is3DActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
            style={{
              background: glareBackground,
            }}
          />
        )}

        {/* Card Content with True 3D Depth Isolation & Parallax */}
        <div
          className="relative z-10 h-full"
          style={{ transform: "translateZ(4px)", transformStyle: "preserve-3d" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 pb-3 mb-2 border-b border-[rgba(255,255,255,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold tracking-wider text-[#F2F6FA] uppercase flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
