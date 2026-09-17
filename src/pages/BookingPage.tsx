import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Stepper } from "@/components/ui/Stepper";
import { LoadingState } from "@/components/PageStates";
import {
  bookReservation,
  fetchAvailableTimes,
  fetchBusinessHours,
  fetchMonthAvailability,
  fetchReservationConfig,
} from "@/lib/api";
import {
  buildDaySlots,
  formatFullDate,
  formatSlotTime,
  parseISODate,
  toISODate,
  type ReservationConfig,
} from "@/lib/booking";
import type { BusinessHours } from "@/lib/content";
import { IMG } from "@/lib/content";
import { formatTime } from "@/lib/format";
import { isEmailConfigured, sendConfirmationEmail } from "@/lib/email";
import { loadSavedGuest, useBookingStore } from "@/store/useBookingStore";
import { PartySizePicker } from "@/components/booking/PartySizePicker";
import { DateCalendar } from "@/components/booking/DateCalendar";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { GuestDetailsForm, validateGuest, type GuestErrors } from "@/components/booking/GuestDetailsForm";
import { MobileActionBar } from "@/components/booking/MobileActionBar";
import { ConfirmationScreen } from "@/components/booking/ConfirmationScreen";
import { usePageMeta } from "@/lib/seo";

const STEPS = [{ label: "Details" }, { label: "Time" }, { label: "Guest" }];

function addDaysISO(dateStr: string, days: number): string {
  const d = parseISODate(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Phase 2 — guest booking flow (transactional shell, nav suppressed per
 * the booking mockups). Steps: Details → Time → Guest → Confirmation.
 * Optimistic confirmation: the RACED error from book_reservation() rolls
 * back to a refreshed time list instead of failing silently (TRD §3.3).
 */
export function BookingPage() {
  usePageMeta("Reserve a Table", "Book your table at Crumb & Confetti in under a minute — pick a date, time, and party size.");
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const {
    step,
    setStep,
    partySize,
    setPartySize,
    date,
    setDate,
    time,
    setTime,
    guest,
    setGuest,
    saveDetails,
    setSaveDetails,
    confirmation,
    setConfirmation,
    resetFlow,
  } = useBookingStore();

  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar availability (per visible month)
  const [viewMonth, setViewMonth] = useState(() =>
    toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [monthAvail, setMonthAvail] = useState<Record<string, number> | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  // Time slots for the selected date
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [raced, setRaced] = useState(false);
  const [guestErrors, setGuestErrors] = useState<GuestErrors>({});

  const stepRef = useRef<HTMLDivElement>(null);

  // Load booking config + business hours once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [c, h] = await Promise.all([fetchReservationConfig(), fetchBusinessHours()]);
      if (cancelled) return;
      setConfig(c);
      setHours(h);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill guest details the guest saved previously.
  useEffect(() => {
    const saved = loadSavedGuest();
    if (saved) {
      setGuest({
        name: saved.name ?? "",
        email: saved.email ?? "",
        phone: saved.phone ?? "",
        specialRequests: saved.specialRequests ?? "",
      });
      setSaveDetails(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Availability dots for the visible month. Always resets loading on
  // success OR failure so a Supabase hiccup never strands a skeleton.
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setAvailLoading(true);
    void fetchMonthAvailability(viewMonth, partySize)
      .then((a) => {
        if (cancelled) return;
        setMonthAvail(a);
      })
      .catch(() => {
        if (!cancelled) setMonthAvail(null);
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewMonth, partySize, config]);

  // Available times for the selected date + party size.
  useEffect(() => {
    if (!date) {
      setAvailableTimes([]);
      setTimesLoading(false);
      return;
    }
    let cancelled = false;
    setTimesLoading(true);
    void fetchAvailableTimes(date, partySize)
      .then((t) => {
        if (cancelled) return;
        setAvailableTimes(t);
      })
      .catch(() => {
        if (!cancelled) setAvailableTimes([]);
      })
      .finally(() => {
        if (!cancelled) setTimesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, partySize, refreshKey]);

  const today = toISODate(new Date());
  const maxDate = config ? addDaysISO(today, config.booking_window_days) : today;
  const closedDays = useMemo(() => hours.filter((h) => h.is_closed).map((h) => h.day_of_week), [hours]);

  const allSlots = useMemo(() => {
    if (!date || !hours.length || !config) return [];
    return buildDaySlots(date, hours, config).map((d) => d.toISOString());
  }, [date, hours, config]);

  const closesAt = useMemo(() => {
    if (!date || !hours.length) return undefined;
    const h = hours.find((x) => x.day_of_week === parseISODate(date).getDay());
    return h && !h.is_closed ? formatTime(h.close_time) : undefined;
  }, [date, hours]);

  const dateLabel = date ? formatFullDate(date) : "";
  const shortDate = date
    ? parseISODate(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  // Focus the step region + scroll to top on step change.
  useEffect(() => {
    stepRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const clearBanner = useCallback(() => {
    setBookError(null);
    setRaced(false);
  }, []);

  async function handleConfirm() {
    const errs = validateGuest(guest);
    if (Object.keys(errs).length > 0) {
      setGuestErrors(errs);
      return;
    }
    setGuestErrors({});
    clearBanner();
    setSubmitting(true);
    const result = await bookReservation({
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      partySize,
      startTime: time!,
      specialRequests: guest.specialRequests || undefined,
    });
    setSubmitting(false);

    if (result.ok && result.confirmationCode && result.startTime) {
      setConfirmation({
        code: result.confirmationCode,
        startTime: result.startTime,
        endTime: result.endTime ?? result.startTime,
        tableId: result.tableId,
      });
      if (saveDetails) setSaveDetails(true); // persists guest to localStorage
      setStep(3);
      void sendConfirmationEmail({
        toName: guest.name,
        toEmail: guest.email,
        confirmationCode: result.confirmationCode,
        startTime: result.startTime,
        endTime: result.endTime ?? result.startTime,
        partySize,
        dateLabel,
        timeLabel: formatSlotTime(result.startTime),
      });
    } else if (result.raced) {
      setRaced(true);
      setTime(null);
      setRefreshKey((k) => k + 1);
      setStep(1);
    } else {
      setBookError(result.error ?? "Something went wrong — please try again.");
    }
  }

  function goNext() {
    clearBanner();
    if (step === 0 && date) setStep(1);
    else if (step === 1 && time) setStep(2);
  }

  function cancel() {
    resetFlow();
    navigate("/");
  }

  const mobileBar =
    step === 0
      ? {
          label: "Your Selection",
          summary: (
            <>
              Reserving for <span className="font-bold text-primary">{partySize}</span>{" "}
              {partySize === 1 ? "guest" : "guests"} on{" "}
              <span className="font-bold text-primary">{shortDate || "—"}</span>
            </>
          ),
          ctaLabel: "Continue to Time",
          onCta: goNext,
          disabled: !date,
        }
      : step === 1
        ? {
            label: "Your Selection",
            summary: (
              <>
                Selection: <span className="font-bold text-primary">{time ? formatSlotTime(time) : "—"}</span> on{" "}
                <span className="font-bold text-primary">{shortDate}</span>
              </>
            ),
            ctaLabel: "Continue to Details",
            onCta: goNext,
            disabled: !time,
          }
        : {
            label: "Almost there",
            summary: (
              <>
                Confirming <span className="font-bold text-primary">{partySize}</span> on{" "}
                <span className="font-bold text-primary">{shortDate}</span>
                {time ? <> at <span className="font-bold text-primary">{formatSlotTime(time)}</span></> : null}
              </>
            ),
            ctaLabel: "Confirm Reservation",
            onCta: handleConfirm,
            disabled: submitting,
          };

  return (
    <div className="relative min-h-screen bg-background-cream font-body-md text-on-surface antialiased">
      {/* Decorative sprinkle background */}
      <div aria-hidden="true" className="doodle-bg-dots pointer-events-none fixed inset-0 z-0" />

      {/* Desktop header — transactional shell (per booking mockup) */}
      <header className="absolute left-0 right-0 top-0 z-50 hidden items-center justify-between p-6 md:flex">
        <button
          type="button"
          onClick={cancel}
          className="flex items-center gap-2 text-on-surface transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" size="sm" />
          <span className="font-label-bold text-label-bold">CANCEL BOOKING</span>
        </button>
        <span className="font-headline-md text-headline-md font-bold tracking-tighter text-on-surface">
          CRUMB &amp; CONFETTI
        </span>
        <span className="w-32" aria-hidden="true" />
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-on-surface bg-background-cream px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label={step > 0 ? "Go back a step" : "Cancel booking"}
          onClick={() => (step > 0 ? setStep(step - 1) : cancel())}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-transform hover:scale-105 active:scale-95"
        >
          <Icon name="arrow_back" size="sm" />
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Reserve a Table</h1>
        <button
          type="button"
          aria-label="Close and cancel booking"
          onClick={cancel}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-transform hover:scale-105 active:scale-95"
        >
          <Icon name="close" size="sm" />
        </button>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[800px] px-4 pb-44 pt-20 md:px-6 md:pb-16 md:pt-28">
        {/* Title */}
        {step < 3 && (
          <div className="mb-8 text-center">
            <h1 className="relative inline-block font-display text-4xl text-on-surface md:text-[56px]">
              Reserve a Table
              <svg
                aria-hidden="true"
                className="absolute -bottom-2 left-0 h-3 w-full text-secondary-container"
                fill="none"
                viewBox="0 0 200 12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
              </svg>
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body-lg text-body-lg text-on-surface-variant">
              Join us for a daily dose of celebration. Select a date and time to secure your spot.
            </p>
          </div>
        )}

        {/* Progress */}
        {step < 3 && (
          <>
            <div className="mb-10 hidden justify-center md:flex">
              <Stepper steps={STEPS} current={step} />
            </div>
            <div className="mb-6 md:hidden">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-label-bold text-label-bold uppercase tracking-widest text-primary">
                  Step {step + 1}: {STEPS[step].label}
                </span>
                <span className="font-label-bold text-label-bold text-on-surface-variant">{step + 1} of 3</span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-3 flex-1 rounded-full border-2 transition-all duration-500",
                      i <= step ? "border-on-surface bg-primary-container" : "border-on-surface/10 bg-surface-container-high"
                    )}
                  />
                ))}
              </div>
              {step === 2 && (
                <p className="mt-3 text-center font-headline-md text-headline-md text-primary">Almost there! 🧁</p>
              )}
            </div>
          </>
        )}

        {/* Race-condition / error banner */}
        {(bookError || raced) && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-on-surface bg-error-container p-4 font-body-md text-on-error-container"
          >
            <Icon name="error" size="sm" className="mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{raced ? "That slot was just taken" : "Booking didn't go through"}</p>
              <p>
                {raced
                  ? "Someone beat you to it by milliseconds. Here are fresh times for your party — pick another."
                  : bookError}
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={clearBanner}
              className="rounded-lg p-1 transition-colors hover:bg-on-error-container/10"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState label="Opening the bakehouse" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              ref={stepRef}
              tabIndex={-1}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="focus:outline-none"
            >
              {/* Step 1 — Details */}
              {step === 0 && (
                <div className="rounded-[20px] border-2 border-on-surface bg-surface-white p-6 shadow-[4px_4px_0_#231a11] md:p-10">
                  <section>
                    <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                      <Icon name="group" size="md" className="text-primary" /> Party Size
                    </h2>
                    <PartySizePicker value={partySize} onChange={setPartySize} maxPartySize={config?.max_party_size ?? 8} />
                  </section>

                  <section className="mt-8">
                    <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                      <Icon name="calendar_month" size="md" className="text-secondary" /> Select Date
                    </h2>
                    <DateCalendar
                      value={date}
                      onChange={setDate}
                      closedDays={closedDays}
                      availability={monthAvail}
                      minDate={today}
                      maxDate={maxDate}
                      loading={availLoading}
                      onViewChange={setViewMonth}
                    />
                  </section>

                  {/* Planning a party? note */}
                  <div className="mt-8 flex items-start gap-4 rounded-2xl border-2 border-on-surface bg-surface-container-low p-4">
                    <div className="rounded-xl border border-on-surface bg-secondary-container p-2">
                      <Icon name="celebration" size="md" className="text-on-secondary-container" />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">Planning a party?</h3>
                      <p className="font-body-sm text-on-surface-variant">
                        For groups larger than {config?.max_party_size ?? 8}, please contact us directly for special
                        event packages!
                      </p>
                    </div>
                  </div>

                  {/* Desktop inline actions */}
                  <div className="mt-4 hidden flex-col items-center justify-between gap-4 border-t-2 border-dashed border-outline-variant pt-6 sm:flex-row md:flex">
                    <p className="text-center font-body-md text-on-surface-variant sm:text-left">
                      Reserving for <strong className="text-on-surface">{partySize} {partySize === 1 ? "guest" : "guests"}</strong>{" "}
                      on <strong className="text-on-surface">{date ? dateLabel : "—"}</strong>
                    </p>
                    <button
                      type="button"
                      disabled={!date}
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-primary-container px-8 py-4 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[4px_4px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary hover:text-on-primary active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      Continue to Time <Icon name="arrow_forward" size="sm" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 — Time */}
              {step === 1 && (
                <div className="rounded-[20px] border-2 border-on-surface bg-surface-white p-6 shadow-[4px_4px_0_#231a11] md:p-10">
                  {/* Selection strip */}
                  <div className="mb-8 flex items-center justify-between rounded-2xl border-2 border-on-surface bg-surface-container-low p-4">
                    <div className="flex items-center gap-3">
                      <Icon name="event" size="md" className="text-primary" />
                      <div>
                        <span className="font-label-bold text-[12px] uppercase text-on-surface-variant">Reservation</span>
                        <p className="font-bold">
                          {date ? parseISODate(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"} •{" "}
                          {partySize} {partySize === 1 ? "guest" : "guests"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="rounded-full px-4 py-2 font-bold text-primary transition-colors hover:bg-primary/10"
                    >
                      Edit
                    </button>
                  </div>

                  <h2 className="mb-6 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                    <Icon name="schedule" size="md" className="text-secondary" /> Select a Time
                  </h2>
                  <TimeSlotPicker
                    slots={allSlots}
                    available={availableTimes}
                    value={time}
                    onChange={setTime}
                    loading={timesLoading}
                    closesAt={closesAt}
                  />

                  {/* Desktop inline actions */}
                  <div className="mt-4 hidden flex-col items-center justify-between gap-4 border-t-2 border-dashed border-outline-variant pt-6 sm:flex-row md:flex">
                    <p className="text-center font-body-md text-on-surface-variant sm:text-left">
                      {time ? (
                        <>
                          Selection: <strong className="text-on-surface">{formatSlotTime(time)}</strong> on{" "}
                          <strong className="text-on-surface">{shortDate}</strong>
                        </>
                      ) : (
                        "Pick a time to continue"
                      )}
                    </p>
                    <button
                      type="button"
                      disabled={!time}
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-primary-container px-8 py-4 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[4px_4px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary hover:text-on-primary active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      Continue to Details <Icon name="arrow_forward" size="sm" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Guest details */}
              {step === 2 && (
                <div className="rounded-[20px] border-2 border-on-surface bg-surface-white p-6 shadow-[4px_4px_0_#231a11] md:p-10">
                  {/* Your Selection summary */}
                  <div className="relative mb-8 overflow-hidden rounded-xl border-2 border-on-surface bg-surface-white p-5 shadow-[4px_4px_0_#231a11]">
                    <div
                      aria-hidden="true"
                      className="absolute -right-4 -top-4 flex h-12 w-12 rotate-12 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container"
                    >
                      <Icon name="auto_awesome" size="md" />
                    </div>
                    <div className="mb-4 flex items-start justify-between">
                      <h2 className="font-headline-md text-headline-md">Your Selection</h2>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="font-label-bold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-tertiary"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-3">
                      <p className="flex items-center gap-3">
                        <Icon name="calendar_today" size="sm" className="text-primary" />
                        <span className="font-body-lg text-body-lg">{dateLabel}</span>
                      </p>
                      <p className="flex items-center gap-3">
                        <Icon name="schedule" size="sm" className="text-primary" />
                        <span className="font-body-lg text-body-lg">{time ? formatSlotTime(time) : "—"}</span>
                      </p>
                      <p className="flex items-center gap-3">
                        <Icon name="group" size="sm" className="text-primary" />
                        <span className="font-body-lg text-body-lg">
                          {partySize} {partySize === 1 ? "person" : "people"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <GuestDetailsForm
                    value={guest}
                    errors={guestErrors}
                    onChange={setGuest}
                    saveDetails={saveDetails}
                    onToggleSave={setSaveDetails}
                  />

                  {/* Desktop inline actions */}
                  <div className="mt-4 hidden flex-col gap-3 border-t-2 border-dashed border-outline-variant pt-6 md:flex">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirm}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-on-surface bg-primary-container py-4 font-headline-md text-headline-md text-on-primary-container shadow-[4px_4px_0_#231a11] transition-all hover:scale-[1.01] hover:bg-primary hover:text-on-primary active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined animate-spin text-base"
                            style={{ animationDuration: "1.1s" }}
                          >
                            progress_activity
                          </span>
                          Securing your table…
                        </>
                      ) : (
                        <>
                          <span>Confirm Reservation</span>
                          <Icon name="send" size="sm" filled />
                        </>
                      )}
                    </button>
                    <p className="text-center font-label-bold text-[10px] uppercase tracking-tight text-on-surface-variant">
                      By clicking, you agree to our Sweet Terms &amp; Conditions
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4 — Confirmation (optimistic) */}
              {step === 3 && confirmation && (
                <ConfirmationScreen
                  code={confirmation.code}
                  date={date!}
                  startTime={confirmation.startTime}
                  endTime={confirmation.endTime}
                  partySize={partySize}
                  guestName={guest.name}
                  emailConfigured={isEmailConfigured}
                  onDone={resetFlow}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Mobile sticky action bar */}
      {step < 3 && (
        <MobileActionBar
          label={mobileBar.label}
          summary={mobileBar.summary}
          imageUrl={IMG.pie}
          imageAlt="A fresh baked pie from Crumb & Confetti"
          ctaLabel={mobileBar.ctaLabel}
          onCta={mobileBar.onCta}
          disabled={mobileBar.disabled}
          loading={step === 2 && submitting}
        />
      )}
    </div>
  );
}
