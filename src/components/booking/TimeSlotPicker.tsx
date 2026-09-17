import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { formatSlotTime } from "@/lib/booking";

interface TimeSlotPickerProps {
  /** All candidate slot start ISO strings for the day. */
  slots: string[];
  /** Subset of slots that are actually available. */
  available: string[];
  value: string | null;
  onChange: (time: string) => void;
  loading?: boolean;
  /** Close time label like "6:00 PM" for the closing note. */
  closesAt?: string;
}

/** "Morning" | "Afternoon" | "Evening" grouping by local hour. */
function bucket(hour: number): "Morning" | "Afternoon" | "Evening" {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

const BUCKET_ORDER: ("Morning" | "Afternoon" | "Evening")[] = ["Morning", "Afternoon", "Evening"];

/**
 * Available-time grid (booking mockup): slots grouped into Morning /
 * Afternoon / Evening, unavailable slots disabled, selected in coral.
 */
export function TimeSlotPicker({ slots, available, value, onChange, loading, closesAt }: TimeSlotPickerProps) {
  // Compare by epoch ms so UTC strings from the RPC match local slot Dates.
  const availableSet = useMemo(() => new Set(available.map((a) => new Date(a).getTime())), [available]);

  const groups = useMemo(() => {
    const map = new Map<"Morning" | "Afternoon" | "Evening", string[]>();
    for (const slot of slots) {
      const hour = new Date(slot).getHours();
      const key = bucket(hour);
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return BUCKET_ORDER.map((key) => ({ key, slots: map.get(key) ?? [] }));
  }, [slots]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3" role="status" aria-live="polite">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border-2 border-on-surface/10 bg-surface-container" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-white/60 px-6 py-10 text-center">
        <Icon name="event_busy" size="lg" className="text-on-surface-variant" />
        <p className="font-headline-md text-headline-md text-on-surface">No times left today</p>
        <p className="max-w-sm font-body-md text-on-surface-variant">
          That date is fully booked or closed. Try another day — weekends fill up fast!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(
        (group) =>
          group.slots.length > 0 && (
            <div key={group.key} className="space-y-3">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
                {group.key}
              </h3>
              <div className="grid grid-cols-3 gap-3" role="group" aria-label={`${group.key} times`}>
                {group.slots.map((slot) => {
                  const isAvailable = availableSet.has(new Date(slot).getTime());
                  const isSelected = slot === value;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      onClick={() => onChange(slot)}
                      className={cn(
                        "rounded-xl border-2 py-3 font-bold transition-all duration-150",
                        isSelected
                          ? "border-on-surface bg-primary-container text-on-primary-container shadow-[2px_2px_0_#231a11]"
                          : isAvailable
                            ? "border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] hover:-translate-y-0.5 hover:bg-surface-container-low"
                            : "cursor-not-allowed border-outline-variant bg-surface-container text-on-surface-variant/50"
                      )}
                    >
                      {formatSlotTime(slot)}
                      {!isAvailable && <span className="sr-only"> (sold out)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )
      )}
      {closesAt && (
        <p className="text-center font-body-sm italic text-on-surface-variant">Bakery closes at {closesAt}.</p>
      )}
    </div>
  );
}
