import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "secondary" | "primary" | "tertiary" | "success" | "error" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  secondary: "bg-secondary-container text-on-secondary-container",
  primary: "bg-primary-container text-on-primary-container",
  tertiary: "bg-tertiary-container text-on-tertiary",
  success: "bg-success-mint text-on-surface",
  error: "bg-error-red text-white",
  outline: "bg-surface-white text-on-surface",
};

/** Pill badge for dietary tags, event dates, featured highlights. */
export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full radical-border radical-shadow-sm px-3 py-1 text-label-bold uppercase",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
