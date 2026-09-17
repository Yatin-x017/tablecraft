import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { BlogPost } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { PartySizePicker } from "./PartySizePicker";
import { GuestDetailsForm, validateGuest, type GuestErrors } from "./GuestDetailsForm";
import { ConfettiBurst } from "./ConfettiBurst";
import { GUEST_STORAGE_KEY, loadSavedGuest, type GuestDetails } from "@/store/useBookingStore";
import { mockCode } from "@/lib/booking";

interface EventBookingModalProps {
  post: BlogPost;
  open: boolean;
  onClose: () => void;
}

/**
 * Event RSVP flow (public site). Steps: Spots → Guest details → Confirmation.
 * Mirrors the AdminModal shell (portal, focus trap, scroll lock, Escape) and
 * reuses the table-booking components so the two flows feel identical.
 */
export function EventBookingModal({ post, open, onClose }: EventBookingModalProps) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [spots, setSpots] = useState(2);
  const [guest, setGuest] = useState<GuestDetails>({ name: "", email: "", phone: "", specialRequests: "" });
  const [guestErrors, setGuestErrors] = useState<GuestErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  // Reset the flow whenever the dialog opens, prefilling any saved guest details.
  useEffect(() => {
    if (open) {
      const saved = loadSavedGuest();
      setStep(0);
      setSpots(2);
      setGuest(
        saved
          ? { name: saved.name ?? "", email: saved.email ?? "", phone: saved.phone ?? "", specialRequests: saved.specialRequests ?? "" }
          : { name: "", email: "", phone: "", specialRequests: "" }
      );
      setGuestErrors({});
      setSubmitting(false);
      // A returning guest with prefilled details already opted in before.
      setSaveDetails(saved !== null);
      setCode(null);
    }
  }, [open]);

  // Focus the close button when the dialog opens.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => closeRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function confirm() {
    const errs = validateGuest(guest);
    if (Object.keys(errs).length > 0) {
      setGuestErrors(errs);
      return;
    }
    setGuestErrors({});
    setSubmitting(true);
    // No backend in v1 — simulate a short submit so the confirmation feels real.
    await new Promise((r) => setTimeout(r, 700));
    if (saveDetails) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest));
    }
    setCode(mockCode());
    setSubmitting(false);
    setStep(2);
  }

  const steps = [{ label: "Spots" }, { label: "Details" }, { label: "Confirmed" }];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            aria-label="Close dialog"
            type="button"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-on-surface/60 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Reserve spots for ${post.title}`}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] radical-border bg-surface-white radical-shadow sm:rounded-[24px]"
            initial={reduce ? false : { opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-on-surface bg-surface-container-low px-6 py-5">
              <div>
                <h2 className="font-headline-md text-headline-md leading-tight text-on-surface">Reserve a Spot</h2>
                <p className="mt-1 line-clamp-1 font-body-sm text-on-surface-variant">{post.title}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-surface-white text-on-surface radical-shadow-sm transition-transform hover:rotate-90 hover:bg-surface-container"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 2 && code ? (
                <>
                  <ConfettiBurst count={70} />
                  <div className="text-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-on-surface bg-success-mint shadow-[3px_3px_0_#231a11]">
                      <Icon name="check" size="lg" filled className="text-on-surface" />
                    </span>
                    <h3 className="mt-4 font-headline-lg text-headline-lg text-on-surface">You're in! 🎉</h3>
                    <p className="mx-auto mt-2 max-w-sm font-body-md text-on-surface-variant">
                      See you at <span className="font-bold text-on-surface">{post.title}</span> —{" "}
                      {spots} {spots === 1 ? "spot" : "spots"} reserved.
                    </p>
                  </div>
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-dashed border-on-surface bg-secondary-container/20 p-6 text-center">
                    <p className="font-label-bold text-label-bold uppercase text-on-surface-variant">Your RSVP code</p>
                    <p className="mt-2 font-display text-display text-primary tracking-[0.2em]">{code}</p>
                  </div>
                  <dl className="mx-auto mt-6 max-w-sm space-y-3 rounded-2xl border-2 border-on-surface bg-surface-white p-6 radical-shadow">
                    {[
                      { icon: "celebration", label: "Event", value: post.title },
                      { icon: "calendar_month", label: "Date", value: post.event_date ? formatDate(post.event_date) : "TBA" },
                      { icon: "group", label: "Spots", value: `${spots} ${spots === 1 ? "guest" : "guests"}` },
                      { icon: "person", label: "Name", value: guest.name },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <Icon name={row.icon} size="sm" className="text-primary" />
                        <dt className="w-16 flex-shrink-0 font-label-bold text-label-bold uppercase text-on-surface-variant">
                          {row.label}
                        </dt>
                        <dd className="truncate font-body-lg text-body-lg text-on-surface">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <>
                  {/* Event snapshot */}
                  <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-on-surface bg-surface-container-low p-4">
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border-2 border-on-surface object-cover"
                    />
                    <div className="min-w-0">
                      <Badge variant="tertiary">Event</Badge>
                      <p className="mt-1.5 truncate font-bold text-on-surface">{post.title}</p>
                      {post.event_date && (
                        <p className="mt-0.5 flex items-center gap-1.5 font-body-sm text-on-surface-variant">
                          <Icon name="calendar_month" size="sm" className="text-primary" />
                          {formatDate(post.event_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step progress */}
                  <div className="mb-6 flex items-center gap-2">
                    {steps.map((s, i) => (
                      <div key={s.label} className="flex flex-1 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-on-surface font-label-bold text-label-bold",
                            i <= step ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant"
                          )}
                        >
                          {i < step ? <Icon name="check" size="sm" /> : i + 1}
                        </span>
                        <span className={cn("hidden font-label-bold text-label-bold uppercase sm:block", i <= step ? "text-on-surface" : "text-on-surface-variant")}>
                          {s.label}
                        </span>
                        {i < steps.length - 1 && <div className="h-0.5 flex-1 rounded bg-outline-variant" />}
                      </div>
                    ))}
                  </div>

                  {step === 0 && (
                    <div>
                      <h3 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                        <Icon name="group" size="md" className="text-primary" /> How many spots?
                      </h3>
                      <PartySizePicker value={spots} onChange={setSpots} maxPartySize={10} />
                      <p className="mt-4 font-body-sm text-on-surface-variant">
                        Need more than 10? Ping us at the counter or drop us a line — we'll make it work.
                      </p>
                    </div>
                  )}

                  {step === 1 && (
                    <GuestDetailsForm
                      value={guest}
                      errors={guestErrors}
                      onChange={(patch) => setGuest((g) => ({ ...g, ...patch }))}
                      saveDetails={saveDetails}
                      onToggleSave={setSaveDetails}
                    />
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {step < 2 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-on-surface bg-surface-container-low px-6 py-4">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-label-bold text-label-bold uppercase text-on-surface transition-colors hover:bg-on-surface/5"
                  >
                    <Icon name="arrow_back" size="sm" /> Back
                  </button>
                ) : (
                  <span className="font-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">{spots}</strong> {spots === 1 ? "spot" : "spots"}
                  </span>
                )}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={step === 0 ? () => setStep(1) : confirm}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary hover:text-on-primary active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span aria-hidden="true" className="material-symbols-outlined animate-spin text-base">
                        progress_activity
                      </span>
                      Saving…
                    </>
                  ) : step === 0 ? (
                    <>
                      Continue <Icon name="arrow_forward" size="sm" />
                    </>
                  ) : (
                    <>
                      Reserve my spots <Icon name="send" size="sm" filled />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex items-center justify-end gap-3 border-t-2 border-on-surface bg-surface-container-low px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[3px_3px_0_#ff6586] transition-all hover:scale-[1.02] hover:bg-primary active:translate-y-0.5"
                >
                  Done <Icon name="check" size="sm" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
