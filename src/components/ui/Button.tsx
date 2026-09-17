import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary" // coral container — main CTAs
  | "dark" // espresso — high-impact secondary
  | "secondary" // butter yellow
  | "tertiary" // berry pink
  | "outline" // white card surface
  | "ghost"; // transparent

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Fully rounded pill (used for nav/book CTAs). */
  pill?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-container text-on-primary-container border-on-surface hover:bg-primary hover:text-on-primary",
  dark: "bg-on-surface text-surface-white border-on-surface hover:bg-primary",
  secondary: "bg-secondary-container text-on-surface border-on-surface hover:bg-secondary hover:text-on-secondary",
  tertiary: "bg-tertiary-container text-on-tertiary border-on-surface hover:bg-tertiary",
  outline: "bg-surface-white text-on-surface border-on-surface hover:bg-surface-container",
  ghost: "bg-transparent text-on-surface border-transparent hover:bg-primary-container/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-label-bold",
  md: "px-6 py-3 text-label-bold",
  lg: "px-8 py-4 text-label-bold",
};

/**
 * Tactile brand button — espresso border + offset shadow + press-down
 * micro-interaction, per the Crumb & Confetti design system.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", pill, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-label-bold uppercase",
        "radical-border radical-shadow radical-button-press",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        pill ? "rounded-full" : "rounded-xl",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
