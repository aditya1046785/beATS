"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ButtonProps = {
  variant: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  glow?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-7 py-3.5 text-[15px]",
  lg: "px-10 py-4 text-lg",
};

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "bg-[#3B82F6] text-white hover:brightness-110 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:scale-[1.02]",
  ghost:
    "bg-transparent text-[#A0A0A0] border border-white/15 hover:border-white/35 hover:text-[#0F0F0F]",
};

function pulseClass(glow?: boolean): string {
  return glow ? "animate-[pulseGlow_3s_ease-in-out_infinite]" : "";
}

const baseClass =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-80";

export default function Button({
  variant,
  size = "md",
  children,
  onClick,
  href,
  className,
  glow,
  fullWidth,
  disabled,
  type = "button",
}: ButtonProps) {
  const classes = [
    baseClass,
    sizeClasses[size],
    variantClasses[variant],
    pulseClass(glow),
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .join(" ")
    .trim();

  if (href) {
    return (
      <motion.div whileHover={{ scale: variant === "ghost" ? 1 : 1.02 }} whileTap={{ scale: 0.99 }}>
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: variant === "ghost" ? 1 : 1.02 }}
      whileTap={{ scale: 0.99 }}
      disabled={disabled}
      type={type}
      className={classes}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
