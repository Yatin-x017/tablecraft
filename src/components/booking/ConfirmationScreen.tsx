import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ConfettiBurst } from "./ConfettiBurst";
import { formatFullDate, formatSlotTime } from "@/lib/booking";

interface ConfirmationScreenProps {
  code: string;
  date: string;
  /** ISO start of the reservation. */
  startTime: string;
  /** ISO end of the reservation (from the RPC — no hardcoded duration). */
  endTime: string;
  partySize: number;
  guestName: string;
  emailConfigured: boolean;
  /** Fired when the guest leaves via either exit path (resets the flow). */
  onDone: () => void;
}

function toIcsDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "");
}

/** Confirmation screen — renders optimistically the instant the RPC resolves. */
export function ConfirmationScreen({
  code,
  date,
  startTime,
  endTime,
  partySize,
  guestName,
  emailConfigured,
  onDone,
}: ConfirmationScreenProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  // .ics download so guests can drop it straight into their calendar
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Crumb & Confetti//Reservation//EN",
    "BEGIN:VEVENT",
    `UID:${code}@crumbandconfetti`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(startTime)}`,
    `DTEND:${toIcsDate(endTime)}`,
    `SUMMARY:Reservation for ${partySize} at Crumb & Confetti`,
    `DESCRIPTION:Confirmation code ${code}`,
    "LOCATION:48 Sprinkle Street, Brooklyn",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

  return (
    <div className="relative">
      <ConfettiBurst />
      <div className="text-center">
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-on-surface bg-success-mint shadow-[3px_3px_0_#231a11]">
          <Icon name="check" size="lg" filled className="text-on-surface" />
        </span>
        <h2 className="mt-6 font-headline-lg text-headline-lg text-on-surface">You're booked! 🧁</h2>
        <p className="mx-auto mt-2 max-w-md font-body-md text-on-surface-variant">
          {guestName ? `${guestName.split(" ")[0]}, your` : "Your"} table is reserved for{" "}
          {partySize} {partySize === 1 ? "guest" : "guests"} on {formatFullDate(date)} at{" "}
          {formatSlotTime(startTime)}.
        </p>
      </div>

      {/* Confirmation code */}
      <div className="mx-auto mt-8 max-w-sm rounded-2xl border-2 border-dashed border-on-surface bg-secondary-container/20 p-6 text-center">
        <p className="font-label-bold text-label-bold uppercase text-on-surface-variant">Your confirmation code</p>
        <p className="mt-2 font-display text-display text-primary tracking-[0.2em]">{code}</p>
        <button
          type="button"
          onClick={copyCode}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-on-surface bg-surface-white px-4 py-1.5 font-label-bold text-label-bold uppercase shadow-[2px_2px_0_#231a11] transition-all hover:bg-secondary-container active:translate-y-0.5"
        >
          <Icon name={copied ? "check" : "content_copy"} size="sm" />
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>

      {/* Summary */}
      <dl className="mx-auto mt-8 max-w-sm space-y-3 rounded-2xl border-2 border-on-surface bg-surface-white p-6 shadow-[4px_4px_0_#231a11]">
        {[
          { icon: "calendar_month", label: "Date", value: formatFullDate(date) },
          { icon: "schedule", label: "Time", value: `${formatSlotTime(startTime)} – ${formatSlotTime(endTime)}` },
          { icon: "group", label: "Party", value: `${partySize} ${partySize === 1 ? "guest" : "guests"}` },
          { icon: "confirmation_number", label: "Code", value: code },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <Icon name={row.icon} size="sm" className="text-primary" />
            <dt className="w-16 flex-shrink-0 font-label-bold text-label-bold uppercase text-on-surface-variant">
              {row.label}
            </dt>
            <dd className="font-body-lg text-body-lg text-on-surface">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mx-auto mt-6 max-w-md text-center font-body-sm text-on-surface-variant">
        {emailConfigured
          ? "A confirmation email is on its way. Need to change plans? Use the secure link in that email."
          : "Show this code when you arrive — we'll take it from there."}
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={icsUrl}
          download={`crumb-confetti-${code}.ics`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[3px_3px_0_#ff6586] transition-all hover:scale-[1.02] hover:bg-primary"
        >
          <Icon name="calendar_month" size="sm" /> Add to calendar
        </a>
        <Link
          to="/"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary hover:text-on-primary"
        >
          Back to home <Icon name="arrow_forward" size="sm" />
        </Link>
      </div>
    </div>
  );
}
