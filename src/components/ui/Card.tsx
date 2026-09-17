import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Radius: lg (20px, default) or xl (32px, bento/dashboard). */
  radius?: "lg" | "xl";
  /** Hover lift micro-interaction. */
  hoverable?: boolean;
}

/**
 * Brand card — white surface, espresso border, offset shadow.
 * Per design system: cards use 20px radius, `shadow-soft` tinted shadows.
 */
export function Card({ className, radius = "lg", hoverable, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-white radical-border radical-shadow",
        radius === "lg" ? "rounded-[20px]" : "rounded-[32px]",
        hoverable && "transition-transform duration-300 hover:-translate-y-1.5",
        className
      )}
      {...props}
    />
  );
}
