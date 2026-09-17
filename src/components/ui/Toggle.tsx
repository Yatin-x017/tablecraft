import { useId } from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Brand toggle — the "Available / Sold Out" switch from the Menu Manager mockup.
 * Track flips to success-mint when on.
 */
export function Toggle({ checked, onCheckedChange, label, disabled, id }: ToggleProps) {
  const autoId = useId();
  const toggleId = id ?? autoId;
  return (
    <label htmlFor={toggleId} className={cn("inline-flex cursor-pointer items-center gap-2", disabled && "opacity-50")}>
      <span className="relative inline-flex">
        <input
          id={toggleId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "h-6 w-11 rounded-full border-2 border-on-surface bg-surface-container-highest",
            "transition-colors peer-checked:bg-success-mint/30"
          )}
        />
        <span
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full border border-on-surface bg-on-surface-variant",
            "transition-all peer-checked:translate-x-full peer-checked:bg-success-mint"
          )}
        />
      </span>
      {label && <span className="font-label-bold text-label-bold uppercase">{label}</span>}
    </label>
  );
}
