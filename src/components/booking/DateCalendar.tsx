import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { parseISODate, toISODate } from "@/lib/booking";

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

interface DateCalendarProps {
  value: string | null; // "2026-08-12"
  onChange: (date: string) => void;
  /** Day-of-week ints that are closed (0=Sun..6=Sat). */
  closedDays: number[];
  /** Per-day available slot counts for the visible month. */
  availability: Record<string, number> | null;
  /** Earliest selectable date ("today"). */
  minDate: string;
  /** Latest selectable date (today + booking window). */
  maxDate: string;
  loading?: boolean;
  /** Fired with the first day of the newly-visible month. */
  onViewChange?: (monthStart: string) => void;
}

/**
 * Custom calendar (booking mockup): month grid with availability dots,
 * closed/past days disabled, coral selected state.
 */
export function DateCalendar({
  value,
  onChange,
  closedDays,
  availability,
  minDate,
  maxDate,
  loading,
  onViewChange,
}: DateCalendarProps) {
  const today = parseISODate(minDate);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const changeView = useCallback((next: Date) => {
    setView(next);
    onViewChange?.(toISODate(new Date(next.getFullYear(), next.getMonth(), 1)));
  }, [onViewChange]);

  const canPrev = useMemo(() => {
    return view > new Date(today.getFullYear(), today.getMonth(), 1);
  }, [view, today]);

  const canNext = useMemo(() => {
    const max = parseISODate(maxDate);
    return view < new Date(max.getFullYear(), max.getMonth(), 1);
  }, [view, maxDate]);

  const monthLabel = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = first.getDay();
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(toISODate(new Date(view.getFullYear(), view.getMonth(), d)));
    }
    return list;
  }, [view]);

  // Announce month changes to screen readers.
  const [announce, setAnnounce] = useState(monthLabel);
  useEffect(() => setAnnounce(monthLabel), [monthLabel]);

  const isDisabled = useCallback(
    (date: string) => {
      if (date < minDate || date > maxDate) return true;
      if (closedDays.includes(parseISODate(date).getDay())) return true;
      return false;
    },
    [minDate, maxDate, closedDays]
  );

  return (
    <div>
      <div className="overflow-hidden rounded-xl border-2 border-outline-variant">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b-2 border-outline-variant bg-surface-container-high px-4 py-3">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => changeView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon name="chevron_left" size="sm" />
          </button>
          <span className="font-label-bold text-label-bold uppercase text-on-surface" aria-live="polite">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => changeView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon name="chevron_right" size="sm" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-white/60 px-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center font-label-bold text-[12px] text-on-surface-variant">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1 bg-surface-white p-2" role="grid" aria-label={`Calendar for ${monthLabel}`}>
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} aria-hidden="true" />;
            const disabled = isDisabled(date);
            const selected = date === value;
            const count = availability?.[date] ?? 0;
            const hasAvailability = count > 0;
            const dayNum = parseISODate(date).getDate();
            const isToday = date === minDate;

            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                disabled={disabled}
                aria-label={`${formatAriaDate(date)}${hasAvailability ? ", available" : disabled ? ", not available" : ""}`}
                aria-pressed={selected}
                onClick={() => onChange(date)}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center rounded-lg text-[15px] transition-all duration-150",
                  selected
                    ? "-translate-y-0.5 border-2 border-on-surface bg-primary-container font-bold text-on-primary-container shadow-[2px_2px_0_#231a11]"
                    : disabled
                      ? "cursor-not-allowed text-on-surface-variant/40"
                      : hasAvailability
                        ? "cursor-pointer bg-secondary-container/20 font-bold text-on-secondary-container hover:bg-secondary-container/40"
                        : "cursor-pointer text-on-surface hover:bg-surface-container"
                )}
              >
                {dayNum}
                {hasAvailability && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full",
                      selected ? "bg-on-primary-container" : "bg-secondary-container"
                    )}
                  />
                )}
                {isToday && !selected && !disabled && (
                  <span className="absolute bottom-1 text-[9px] font-bold uppercase text-primary">today</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-4 font-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-secondary-container/50" />
          High availability
        </span>
        {loading && (
          <span className="flex items-center gap-1.5" aria-live="polite">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Checking availability…
          </span>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

function formatAriaDate(date: string): string {
  return parseISODate(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
