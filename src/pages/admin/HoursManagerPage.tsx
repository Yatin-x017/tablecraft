import { useState } from "react";
import { useAdminStore, type HolidayDraft } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton, AdminSection } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { formatTime, formatDate, DAY_NAMES, DAY_SHORT } from "@/lib/format";
import { cn } from "@/lib/utils";

const emptyHoliday = (): HolidayDraft => ({
  date: "",
  reason: "",
  isFullDay: true,
  closedFrom: "14:00",
  closedTo: "18:00",
});

export function HoursManagerPage() {
  const { hours, updateHours, holidays, addHoliday, deleteHoliday } = useAdminStore();
  const { toast } = useToast();
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [draft, setDraft] = useState<HolidayDraft>(emptyHoliday());

  const todayIdx = new Date().getDay();

  const saveHoliday = () => {
    if (!draft.date) {
      toast("Date required", { tone: "error", detail: "Pick a closure date." });
      return;
    }
    addHoliday(draft);
    setHolidayOpen(false);
    setDraft(emptyHoliday());
    toast("Closure added", { detail: `${draft.reason || "Holiday"} · ${formatDate(draft.date)}` });
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Hours & Holidays"
        subtitle="Set the weekly rhythm — and the days the oven takes a well-earned rest."
      />

      <AdminSection
        title="Weekly Hours"
        subtitle="Open / close times are venue-local. Closed days block the booking engine."
      >
        <ul className="divide-y-2 divide-surface-container">
          {[...hours]
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((h) => {
              const isToday = h.day_of_week === todayIdx;
              return (
                <li
                  key={h.day_of_week}
                  className={cn(
                    "flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-background-cream md:flex-row md:items-center md:gap-6 md:px-8",
                    isToday && "bg-surface-container-low"
                  )}
                >
                  <div className="flex w-44 items-center gap-3">
                    <span className="font-label-bold text-label-bold text-on-surface">
                      {DAY_NAMES[h.day_of_week]}
                    </span>
                    {isToday && (
                      <span className="rounded-full border-2 border-on-surface bg-secondary-container px-2.5 py-0.5 text-[10px] font-label-bold uppercase radical-shadow-sm">
                        Today
                      </span>
                    )}
                  </div>
                  {h.is_closed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-on-surface bg-error-container px-3 py-1 font-label-bold text-label-bold uppercase text-on-error-container">
                      <Icon name="block" size="sm" /> Closed
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="sr-only" htmlFor={`open-${h.day_of_week}`}>Open time {DAY_SHORT[h.day_of_week]}</label>
                      <input
                        id={`open-${h.day_of_week}`}
                        type="time"
                        value={h.open_time}
                        disabled={h.is_closed}
                        onChange={(e) => updateHours(h.day_of_week, { open_time: e.target.value })}
                        className="h-12 rounded-lg border-2 border-on-surface bg-surface-white px-3 font-body-md disabled:opacity-40 focus:border-primary focus:outline-none"
                      />
                      <span className="font-body-sm text-on-surface-variant">to</span>
                      <label className="sr-only" htmlFor={`close-${h.day_of_week}`}>Close time {DAY_SHORT[h.day_of_week]}</label>
                      <input
                        id={`close-${h.day_of_week}`}
                        type="time"
                        value={h.close_time}
                        disabled={h.is_closed}
                        onChange={(e) => updateHours(h.day_of_week, { close_time: e.target.value })}
                        className="h-12 rounded-lg border-2 border-on-surface bg-surface-white px-3 font-body-md disabled:opacity-40 focus:border-primary focus:outline-none"
                      />
                      <span className="font-body-sm font-bold text-on-surface-variant">
                        {formatTime(h.open_time)} – {formatTime(h.close_time)}
                      </span>
                    </div>
                  )}
                  <div className="md:ml-auto">
                    <Toggle
                      checked={!h.is_closed}
                      onCheckedChange={(open) => {
                        updateHours(h.day_of_week, { is_closed: !open });
                        toast(open ? "Opened for business" : "Day closed", { detail: DAY_NAMES[h.day_of_week], tone: open ? "success" : "info" });
                      }}
                      label={h.is_closed ? "Closed" : "Open"}
                    />
                  </div>
                </li>
              );
            })}
        </ul>
      </AdminSection>

      <div className="mt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Holiday Closures</h3>
            <p className="font-body-sm text-on-surface-variant">Partial closures hide only the affected hours from the booking grid.</p>
          </div>
          <AdminActionButton icon="event_busy" onClick={() => setHolidayOpen(true)}>Add closure</AdminActionButton>
        </div>

        {holidays.length === 0 ? (
          <div className="rounded-[32px] radical-border radical-shadow bg-surface-white p-16 text-center">
            <Icon name="event_available" size="xl" className="mx-auto mb-4 text-primary" />
            <p className="font-headline-md text-headline-md text-on-surface">No closures scheduled</p>
            <p className="mt-2 font-body-md text-on-surface-variant">Add one to block off a holiday or a deep-clean day.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...holidays]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((h) => (
                <div key={h.id} className="flex items-start gap-4 rounded-[20px] radical-border radical-shadow bg-surface-white p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-tertiary-fixed text-tertiary">
                    <Icon name={h.isFullDay ? "event_busy" : "schedule"} size="sm" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-label-bold text-label-bold text-on-surface">{h.reason || "Closure"}</p>
                    <p className="font-body-sm text-on-surface-variant">
                      {formatDate(h.date)} {!h.isFullDay && `· ${formatTime(h.closedFrom ?? "14:00")}–${formatTime(h.closedTo ?? "18:00")}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteHoliday(h.id);
                      toast("Closure removed", { detail: h.reason || "Holiday", tone: "info" });
                    }}
                    aria-label={`Delete closure ${h.reason || h.date}`}
                    className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error-red"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <AdminModal
        open={holidayOpen}
        onClose={() => setHolidayOpen(false)}
        title="Add Holiday Closure"
        subtitle="The booking engine will hide these hours automatically."
        footer={
          <>
            <Button variant="ghost" onClick={() => setHolidayOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveHoliday}>Add Closure</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Date" type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} icon="event" />
          <Input label="Reason (optional)" value={draft.reason} onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))} placeholder="e.g. Christmas Day" icon="edit_note" />
          <div className="sm:col-span-2">
            <Toggle
              checked={draft.isFullDay}
              onCheckedChange={(full) => setDraft((d) => ({ ...d, isFullDay: full }))}
              label="Full-day closure"
            />
          </div>
          {!draft.isFullDay && (
            <>
              <Input label="Closed from" type="time" value={draft.closedFrom ?? "14:00"} onChange={(e) => setDraft((d) => ({ ...d, closedFrom: e.target.value }))} icon="schedule" />
              <Input label="Closed to" type="time" value={draft.closedTo ?? "18:00"} onChange={(e) => setDraft((d) => ({ ...d, closedTo: e.target.value }))} icon="schedule" />
            </>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
