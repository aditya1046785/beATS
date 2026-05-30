import type { ReactNode } from "react";

type GradientTextProps = {
  children: ReactNode;
  className?: string;
};

export default function GradientText({ children, className = "" }: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-[#3B82F6] to-[#818CF8] bg-clip-text text-transparent ${className}`.trim()}
    >
      {children}
    </span>
  );
}
