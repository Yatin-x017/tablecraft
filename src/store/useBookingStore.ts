import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  specialRequests: string;
}

interface BookingState {
  /** 0 = Details, 1 = Time, 2 = Guest, 3 = Confirmation. */
  step: number;
  partySize: number;
  date: string | null; // "2026-08-12"
  time: string | null; // ISO timestamp of the slot start
  guest: GuestDetails;
  saveDetails: boolean;
  /** Last successful booking (confirmation screen data). */
  confirmation: {
    code: string;
    startTime: string;
    endTime: string;
    tableId?: string;
  } | null;
  setStep: (step: number) => void;
  setPartySize: (n: number) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setGuest: (guest: Partial<GuestDetails>) => void;
  setSaveDetails: (save: boolean) => void;
  setConfirmation: (c: BookingState["confirmation"]) => void;
  /** Keep date/party/time, reset guest + confirmation (fresh booking). */
  resetFlow: () => void;
}

export const GUEST_STORAGE_KEY = "crumb-confetti-saved-guest";

/** Load previously saved guest details (if the guest opted in). */
export function loadSavedGuest(): Partial<GuestDetails> | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<GuestDetails>) : null;
  } catch {
    return null;
  }
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      step: 0,
      partySize: 2,
      date: null,
      time: null,
      guest: { name: "", email: "", phone: "", specialRequests: "" },
      saveDetails: false,
      confirmation: null,
      setStep: (step) => set({ step }),
      setPartySize: (n) => set({ partySize: n, time: null }),
      setDate: (date) => set({ date, time: null }),
      setTime: (time) => set({ time }),
      setGuest: (guest) => set({ guest: { ...get().guest, ...guest } }),
      setSaveDetails: (save) => {
        set({ saveDetails: save });
        if (save) {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(get().guest));
        }
      },
      setConfirmation: (confirmation) => set({ confirmation }),
      resetFlow: () => set({ step: 0, date: null, time: null, confirmation: null }),
    }),
    {
      name: "crumb-confetti-booking",
      // Only persist the booking-relevant values (not step/confirmation).
      partialize: (s) => ({ partySize: s.partySize }),
    }
  )
);
