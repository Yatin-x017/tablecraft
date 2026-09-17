import { useMemo, useState } from "react";
import { useAdminStore, type ReservationDraft, type ReservationStatus } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton, AdminSection } from "@/components/admin/AdminUI";
import { MobileReservationCard, RESERVATION_STATUS_STYLES as STATUS_STYLES, AVATAR_BGS } from "@/components/admin/ReservationCard";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { formatSlotTime } from "@/lib/booking";
import { initials } from "@/lib/format";
import { usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

const emptyDraft = (): ReservationDraft => ({
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  partySize: 2,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 90 * 60_000).toISOString(),
  status: "confirmed",
  note: "Phone-in booking",
});

export function ReservationsPage() {
  usePageMeta("Reservations", "Live reservation list with status updates and manual phone-in bookings.");
  const { reservations, setReservationStatus, addReservation, realtimeActive } = useAdminStore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [draft, setDraft] = useState<ReservationDraft>(emptyDraft());

  const filtered = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => {
        const q = query.trim().toLowerCase();
        return !q || r.guestName.toLowerCase().includes(q) || r.confirmationCode.toLowerCase().includes(q);
      });
  }, [reservations, statusFilter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    for (const s of Object.keys(STATUS_STYLES) as ReservationStatus[]) {
      c[s] = reservations.filter((r) => r.status === s).length;
    }
    return c;
  }, [reservations]);

  const act = (id: string, status: ReservationStatus, label: string) => {
    setReservationStatus(id, status);
    toast(label, { detail: `Reservation ${status}` });
  };

  const saveManual = () => {
    if (!draft.guestName.trim()) {
      toast("Name required", { tone: "error", detail: "Enter a guest name." });
      return;
    }
    addReservation(draft);
    setManualOpen(false);
    setDraft(emptyDraft());
    toast("Reservation created", { detail: `${draft.guestName} · ${formatSlotTime(draft.startTime)}` });
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Reservations"
        subtitle="Live list, manual phone-in bookings, and status updates — reconciled in real time."
      />

      {/* Status filter chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(["all", "confirmed", "arrived", "seated", "completed", "cancelled", "no_show"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
            className={cn(
              "rounded-full border-2 border-on-surface px-4 py-2 font-label-bold text-label-bold uppercase transition-all",
              statusFilter === s ? "bg-on-surface text-surface-white radical-shadow-sm" : "bg-surface-white hover:bg-surface-container"
            )}
          >
            {s === "all" ? "All" : STATUS_STYLES[s].label}
            <span className={cn("ml-1.5 rounded-full px-1.5 text-xs", statusFilter === s ? "bg-primary-container text-on-primary-container" : "bg-surface-container")}>
              {counts[s]}
            </span>
          </button>
        ))}
        {/* Realtime indicator — live only in Supabase mode (demo mode is offline by design). */}
        <div className="ml-auto flex items-center gap-2 rounded-full border-2 border-on-surface bg-surface-white px-3 py-1.5" title={realtimeActive ? "Connected to live reservation updates" : "Live updates are off (demo mode or disconnected)"}>
          <span className={cn("h-2.5 w-2.5 rounded-full", realtimeActive ? "bg-success-mint" : "bg-surface-container-highest")} aria-hidden="true" />
          <span className="font-label-bold text-label-bold uppercase text-on-surface-variant">
            {realtimeActive ? "Live" : "Offline"}
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-on-surface-variant" aria-hidden="true">
            <Icon name="search" size="sm" />
          </span>
          <label className="sr-only" htmlFor="res-search">Search reservations</label>
          <input
            id="res-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest or code…"
            className="w-full rounded-xl radical-border radical-shadow-sm bg-surface-white py-2.5 pl-10 pr-4 font-body-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <AdminSection
        title="Reservation List"
        subtitle="Click an action to move a guest through their visit"
        actions={
          <AdminActionButton icon="add_circle" onClick={() => setManualOpen(true)}>Manual booking</AdminActionButton>
        }
      >
        {/* Mobile card list */}
        <div className="space-y-3 p-4 md:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Icon name="event_busy" size="lg" className="mx-auto mb-3 text-primary" />
              <p className="font-headline-md text-headline-md text-on-surface">No reservations here</p>
              <p className="mt-1 font-body-md text-on-surface-variant">Try a different filter, or add a manual booking.</p>
            </div>
          ) : (
            filtered.map((r, i) => (
              <MobileReservationCard
                key={r.id}
                reservation={r}
                index={i}
                actions={
                  <div className="grid grid-cols-2 gap-2">
                    {(r.status === "confirmed" || r.status === "arrived") && (
                      <AdminActionButton tone="success" icon="event_available" onClick={() => act(r.id, "seated", "Seated!")}>
                        Seat
                      </AdminActionButton>
                    )}
                    {r.status === "confirmed" && (
                      <AdminActionButton icon="hail" onClick={() => act(r.id, "arrived", "Arrived")}>Arrive</AdminActionButton>
                    )}
                    {(r.status === "seated" || r.status === "arrived") && (
                      <AdminActionButton icon="flag" onClick={() => act(r.id, "completed", "Completed")}>Done</AdminActionButton>
                    )}
                    {r.status !== "cancelled" && r.status !== "no_show" && (
                      <AdminActionButton tone="danger" icon="person_off" onClick={() => act(r.id, "no_show", "Marked no-show")}>No-show</AdminActionButton>
                    )}
                  </div>
                }
              />
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-high">
              <tr>
                {["Guest", "Party", "Time", "Status", "Actions"].map((h) => (
                  <th key={h} className="border-b-2 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-surface-container">
              {filtered.map((r, i) => {
                const style = STATUS_STYLES[r.status];
                return (
                  <tr key={r.id} className="group transition-colors hover:bg-background-cream">
                    <td className="px-6 py-5 md:px-8">
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-on-surface font-bold", AVATAR_BGS[i % AVATAR_BGS.length])}>
                          {initials(r.guestName)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-label-bold text-on-surface">{r.guestName}</div>
                          <div className="text-body-sm opacity-60">
                            {r.confirmationCode} · {r.note ?? "Walk-in"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body-md md:px-8">{r.partySize}</td>
                    <td className="px-6 py-5 md:px-8">
                      <span className="font-body-md font-bold text-primary">{formatSlotTime(r.startTime)}</span>
                      <span className="block text-body-sm opacity-60">→ {formatSlotTime(r.endTime)}</span>
                    </td>
                    <td className="px-6 py-5 md:px-8">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border-2 border-on-surface px-3 py-1 text-xs font-label-bold", style.className)}>
                        <Icon name={style.icon} size="sm" /> {style.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 md:px-8">
                      <div className="flex flex-wrap gap-2">
                        {(r.status === "confirmed" || r.status === "arrived") && (
                          <AdminActionButton tone="success" icon="event_available" onClick={() => act(r.id, "seated", "Seated!")}>
                            Seat
                          </AdminActionButton>
                        )}
                        {r.status === "confirmed" && (
                          <AdminActionButton icon="hail" onClick={() => act(r.id, "arrived", "Arrived")}>Arrive</AdminActionButton>
                        )}
                        {(r.status === "seated" || r.status === "arrived") && (
                          <AdminActionButton icon="flag" onClick={() => act(r.id, "completed", "Completed")}>Done</AdminActionButton>
                        )}
                        {r.status !== "cancelled" && r.status !== "no_show" && (
                          <AdminActionButton tone="danger" icon="person_off" onClick={() => act(r.id, "no_show", "Marked no-show")}>No-show</AdminActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <Icon name="event_busy" size="lg" className="mx-auto mb-3 text-primary" />
                    <p className="font-headline-md text-headline-md text-on-surface">No reservations here</p>
                    <p className="mt-1 font-body-md text-on-surface-variant">Try a different filter, or add a manual booking.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {/* Manual booking modal */}
      <AdminModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Manual Booking"
        subtitle="Phone-in reservation — pick a time and party size."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveManual}>Create Reservation</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Guest name" value={draft.guestName} onChange={(e) => setDraft((d) => ({ ...d, guestName: e.target.value }))} placeholder="e.g. Penelope Sprinkle" icon="person" />
          </div>
          <Input label="Email" type="email" value={draft.guestEmail} onChange={(e) => setDraft((d) => ({ ...d, guestEmail: e.target.value }))} placeholder="sweetness@bakery.com" icon="mail" />
          <Input label="Phone" type="tel" value={draft.guestPhone} onChange={(e) => setDraft((d) => ({ ...d, guestPhone: e.target.value }))} placeholder="(555) 000-0000" icon="call" />
          <div>
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="mb-party">Party size</label>
            <select
              id="mb-party"
              value={draft.partySize}
              onChange={(e) => setDraft((d) => ({ ...d, partySize: Number(e.target.value) }))}
              className="h-14 w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 font-body-md focus:border-primary focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
              ))}
            </select>
          </div>
          <div>
            <Input
              label="Start time"
              type="datetime-local"
              value={new Date(draft.startTime).toISOString().slice(0, 16)}
              onChange={(e) => {
                const start = new Date(e.target.value);
                setDraft((d) => ({
                  ...d,
                  startTime: start.toISOString(),
                  endTime: new Date(start.getTime() + 90 * 60_000).toISOString(),
                }));
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <Input label="Note" value={draft.note ?? ""} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Birthday, allergies, VIP…" icon="edit_note" />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
