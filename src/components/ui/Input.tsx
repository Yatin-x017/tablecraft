import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Material symbol name rendered inside the field (right side). */
  icon?: string;
  hint?: ReactNode;
}

/**
 * Brand input — cream background, 2px espresso border, coral focus shadow.
 * Per design system: inputs use 12px radius, focus = coral border + offset shadow.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, icon, hint, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block font-label-bold text-label-bold text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-14 w-full rounded-lg border-2 bg-surface-white px-4 font-body-md text-on-surface",
            "placeholder:text-on-surface-variant/50 transition-all duration-200",
            "focus:outline-none focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115]",
            error ? "border-error-red" : "border-on-surface",
            icon && "pr-12",
            className
          )}
          {...props}
        />
        {icon && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          >
            {icon}
          </span>
        )}
      </div>
      {error ? (
        <p className="font-body-sm text-error-red" id={`${inputId}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="font-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
});
