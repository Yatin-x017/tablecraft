import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type IconSize = "sm" | "md" | "lg" | "xl";

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Material Symbols icon name, e.g. "cake", "celebration", "arrow_forward". */
  name: string;
  /** Filled variant (FILL axis = 1). */
  filled?: boolean;
  size?: IconSize | number;
}

const sizeClasses: Record<IconSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

/** Material Symbols wrapper used across the brand (from design mockups). */
export function Icon({ name, filled, size = "md", className, style, ...rest }: IconProps) {
  const numeric = typeof size === "number" ? { fontSize: `${size}px` } : undefined;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined select-none leading-none",
        typeof size !== "number" && sizeClasses[size],
        filled && "[font-variation-settings:'FILL'_1]",
        className
      )}
      style={{ ...numeric, ...style }}
      {...rest}
    >
      {name}
    </span>
  );
}
