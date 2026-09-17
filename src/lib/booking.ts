/**
 * Phase 2 — Reservation engine data layer.
 * Types + mock implementations for the guest booking flow. The api.ts
 * layer calls Supabase RPCs when configured, otherwise falls back to
 * these deterministic mocks so the full flow works without a live project.
 */

import type { BusinessHours } from "./content";

export interface ReservationConfig {
  slot_duration_minutes: number;
  booking_window_days: number;
  min_notice_hours: number;
  max_party_size: number;
}

export interface BookingPayload {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  /** ISO timestamp of the slot start (venue-local, converted to UTC). */
  startTime: string;
  specialRequests?: string;
  section?: string;
}

export interface BookingResult {
  ok: boolean;
  id?: string;
  tableId?: string;
  confirmationCode?: string;
  startTime?: string;
  endTime?: string;
  /** True when the exclusion constraint fired — slot was taken mid-flight. */
  raced?: boolean;
  error?: string;
}

/* ── Mock config (matches supabase seed: 90min slots, 30-day window) ── */

export const mockReservationConfig: ReservationConfig = {
  slot_duration_minutes: 90,
  booking_window_days: 30,
  min_notice_hours: 2,
  max_party_size: 8,
};

/* ── Date helpers ──────────────────────────────────────────────────── */

/** "2026-08-12" -> Date at local midnight. */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> "2026-08-12". */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-08-12" -> "Friday, October 24" style label. */
export function formatFullDate(dateStr: string): string {
  return parseISODate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** ISO timestamp -> "4:00 PM". */
export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Slot grid from business hours ─────────────────────────────────── */

/**
 * All candidate slot start times for a date, per open→close hours.
 * NOTE: business hours are venue-local (e.g. America/New_York) but slots
 * are constructed in the browser's local timezone. The mock availability
 * uses the same construction, so the demo is self-consistent; for a live
 * Supabase deployment the RPC computes slots in the venue timezone and the
 * epoch-ms comparison in TimeSlotPicker keeps them aligned.
 */
export function buildDaySlots(
  dateStr: string,
  hours: BusinessHours[],
  config: ReservationConfig
): Date[] {
  const date = parseISODate(dateStr);
  const day = hours.find((h) => h.day_of_week === date.getDay());
  if (!day || day.is_closed) return [];

  const [oh, om] = day.open_time.split(":").map(Number);
  const [ch, cm] = day.close_time.split(":").map(Number);
  const open = new Date(date.getFullYear(), date.getMonth(), date.getDate(), oh, om);
  const close = new Date(date.getFullYear(), date.getMonth(), date.getDate(), ch, cm);

  const slots: Date[] = [];
  const step = config.slot_duration_minutes * 60_000;
  for (let t = open.getTime(); t + step <= close.getTime(); t += step) {
    slots.push(new Date(t));
  }
  return slots;
}

/** Deterministic pseudo-random seed from a string. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ── Mock availability ─────────────────────────────────────────────── */

/**
 * Deterministic mock of available times: business hours minus ~30% of
 * slots pseudo-randomly "sold out" (seeded by date+party so it's stable
 * across renders), minus slots inside the min-notice window.
 */
export function mockAvailableTimes(
  dateStr: string,
  partySize: number,
  hours: BusinessHours[],
  config: ReservationConfig
): string[] {
  const now = Date.now();
  const noticeMs = config.min_notice_hours * 3_600_000;
  return buildDaySlots(dateStr, hours, config)
    .filter((slot) => {
      if (slot.getTime() <= now + noticeMs) return false;
      return hashStr(`${dateStr}|${partySize}|${slot.getTime()}`) % 10 >= 3;
    })
    .map((slot) => slot.toISOString());
}

/** Per-day availability counts for a month ("2026-08-01" -> n). */
export function mockMonthAvailability(
  monthStart: string,
  partySize: number,
  hours: BusinessHours[],
  config: ReservationConfig
): Record<string, number> {
  const start = parseISODate(monthStart);
  const counts: Record<string, number> = {};
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toISODate(new Date(start.getFullYear(), start.getMonth(), d));
    counts[date] = mockAvailableTimes(date, partySize, hours, config).length;
  }
  return counts;
}

/* ── Mock booking ──────────────────────────────────────────────────── */

/** Random confirmation code (no ambiguous chars). Shared across booking flows. */
export function mockCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Simulated RPC call — succeeds with a code, or returns a RACED result. */
export async function mockBookReservation(payload: BookingPayload, config: ReservationConfig): Promise<BookingResult> {
  await new Promise((r) => setTimeout(r, 900));
  const start = new Date(payload.startTime);
  const end = new Date(start.getTime() + config.slot_duration_minutes * 60_000);
  return {
    ok: true,
    id: `mock-${Date.now()}`,
    tableId: "mock-table",
    confirmationCode: mockCode(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}
