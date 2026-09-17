import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

interface PartySizePickerProps {
  value: number;
  onChange: (n: number) => void;
  maxPartySize: number;
}

/**
 * Party size selector (booking mockup): round chips 1–5 plus a "6+" chip
 * that expands a compact stepper up to max_party_size (default 8).
 */
export function PartySizePicker({ value, onChange, maxPartySize }: PartySizePickerProps) {
  // 1–5 chips + a "6+" chip when the venue seats more than 5 (avoids
  // double-highlighting chip "6" alongside "6+" when value === 6).
  const showSixPlus = maxPartySize > 6;
  const chipCount = showSixPlus ? Math.min(5, maxPartySize) : Math.min(6, maxPartySize);
  const sixPlusActive = value > 5;

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar" role="group" aria-label="Party size">
        {Array.from({ length: chipCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn(
              "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 font-headline-md text-body-lg transition-all duration-150",
              value === n
                ? "-translate-y-1 border-on-surface bg-primary-container text-on-primary-container shadow-[2px_2px_0_#231a11]"
                : "border-outline-variant text-on-surface hover:border-primary-container hover:text-primary"
            )}
          >
            {n}
          </button>
        ))}
        {showSixPlus && (
          <button
            type="button"
            aria-pressed={sixPlusActive}
            onClick={() => onChange(sixPlusActive ? value : 6)}
            className={cn(
              "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 font-headline-md text-body-lg transition-all duration-150",
              sixPlusActive
                ? "-translate-y-1 border-on-surface bg-primary-container text-on-primary-container shadow-[2px_2px_0_#231a11]"
                : "border-outline-variant text-on-surface hover:border-primary-container hover:text-primary"
            )}
          >
            6+
          </button>
        )}
      </div>

      {/* Compact stepper for 6+ groups (only when the venue seats more than 5) */}
      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300",
          showSixPlus && sixPlusActive ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="flex items-center gap-4 rounded-xl border-2 border-on-surface bg-surface-container-low p-3">
            <span className="font-label-bold text-label-bold uppercase text-on-surface-variant">Group size</span>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => onChange(Math.max(6, value - 1))}
                disabled={value <= 6}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-transform hover:scale-105 active:translate-y-0.5 disabled:opacity-40"
              >
                <Icon name="remove" size="sm" />
              </button>
              <span className="w-10 text-center font-headline-md text-headline-md">{value}</span>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => onChange(Math.min(maxPartySize, value + 1))}
                disabled={value >= maxPartySize}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-transform hover:scale-105 active:translate-y-0.5 disabled:opacity-40"
              >
                <Icon name="add" size="sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
