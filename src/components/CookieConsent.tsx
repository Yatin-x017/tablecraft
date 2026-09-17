import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "crumb-confetti-cookie-consent";
type Consent = "accepted" | "essential";

/**
 * Cookie consent banner (TRD §8 / UI/UX §3.15).
 * Blocks non-essential cookies until the visitor makes an explicit choice —
 * the booking flow never depends on non-essential cookies, so the site
 * stays fully usable either way. Preference is stored client-side.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Consent | null;
    if (stored !== "accepted" && stored !== "essential") {
      setVisible(true);
    }
  }, []);

  const choose = (value: Consent) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-24 left-4 right-4 z-[90] mx-auto max-w-2xl rounded-[20px] border-2 border-on-surface bg-surface-white p-6 shadow-[6px_6px_0_#231a11] md:left-auto md:bottom-6 md:right-6"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container"
        >
          <Icon name="cookie" />
        </span>
        <div>
          <h2 className="mb-2 font-headline-md text-headline-md text-on-surface">Cookies, but make them sweet</h2>
          <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
            We use essential cookies to keep the site working, and non-essential ones (analytics, social embeds) only
            if you accept. Your booking works fine either way — no dark patterns here.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-primary-container px-5 py-2.5 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all hover:bg-primary hover:text-on-primary"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => choose("essential")}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-5 py-2.5 font-label-bold text-label-bold uppercase text-on-surface shadow-[3px_3px_0_#231a11] transition-all hover:bg-surface-container"
            >
              Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
