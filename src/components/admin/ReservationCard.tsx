import type { ReactNode } from "react";
import type { AdminReservation, ReservationStatus } from "@/store/useAdminStore";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { formatSlotTime } from "@/lib/booking";
import { initials } from "@/lib/format";

/** Shared status → label/badge/icon map (Dashboard + Reservations). */
export const RESERVATION_STATUS_STYLES: Record<ReservationStatus, { label: string; className: string; icon: string }> = {
  confirmed: { label: "Confirmed", className: "bg-success-mint", icon: "check_circle" },
  arrived: { label: "Arrived", className: "bg-secondary-container", icon: "hail" },
  seated: { label: "Seated", className: "bg-outline-variant", icon: "deck" },
  completed: { label: "Completed", className: "bg-surface-container-high", icon: "flag" },
  cancelled: { label: "Cancelled", className: "bg-error-container", icon: "cancel" },
  no_show: { label: "No Show", className: "bg-surface-container-highest", icon: "person_off" },
};

export const AVATAR_BGS = [
  "bg-primary-fixed-dim",
  "bg-secondary-fixed-dim",
  "bg-tertiary-fixed-dim",
  "bg-primary-fixed",
  "bg-secondary-fixed",
];

interface MobileReservationCardProps {
  reservation: AdminReservation;
  index: number;
  /** Action buttons rendered at the bottom of the card. */
  actions?: ReactNode;
  /** Optional clickable footer link (e.g. "View"). */
  footer?: ReactNode;
}

/**
 * Mobile card layout for reservations — replaces the horizontal-scroll
 * table on small screens (PRD: reservation list must stay usable on mobile).
 * Hidden on md+ where the table takes over.
 */
export function MobileReservationCard({ reservation: r, index, actions, footer }: MobileReservationCardProps) {
  const style = RESERVATION_STATUS_STYLES[r.status];
  return (
    <article className="overflow-hidden rounded-[20px] radical-border radical-shadow bg-surface-white">
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-on-surface font-bold",
            AVATAR_BGS[index % AVATAR_BGS.length]
          )}
        >
          {initials(r.guestName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-label-bold text-on-surface">{r.guestName}</p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-on-surface px-2.5 py-0.5 text-[10px] font-label-bold uppercase",
                style.className
              )}
            >
              <Icon name={style.icon} size="sm" /> {style.label}
            </span>
          </div>
          <p className="mt-0.5 truncate font-body-sm text-on-surface-variant">
            {r.confirmationCode} · {r.note ?? "Walk-in"}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-y-2 border-on-surface bg-on-surface/10">
        <div className="bg-surface-container-low p-3.5">
          <dt className="font-label-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Time</dt>
          <dd className="mt-0.5 font-body-md font-bold text-primary">
            {formatSlotTime(r.startTime)}
            <span className="block font-body-sm font-normal text-on-surface-variant">→ {formatSlotTime(r.endTime)}</span>
          </dd>
        </div>
        <div className="bg-surface-container-low p-3.5">
          <dt className="font-label-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Party</dt>
          <dd className="mt-0.5 font-body-md font-bold text-on-surface">
            {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
          </dd>
        </div>
      </dl>

      {(actions || footer) && <div className="p-3">{actions ?? footer}</div>}
    </article>
  );
}
