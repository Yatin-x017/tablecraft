import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/** Brand textarea — matches Input styling (cream, espresso border, coral focus). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, rows = 3, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-lg border-2 bg-surface-white p-4 font-body-md text-on-surface",
          "placeholder:text-on-surface-variant/50 transition-all duration-200",
          "focus:outline-none focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115]",
          error ? "border-error-red" : "border-on-surface",
          className
        )}
        {...props}
      />
      {error && <p className="font-body-sm text-error-red">{error}</p>}
    </div>
  );
});
