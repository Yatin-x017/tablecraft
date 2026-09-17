import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface MobileActionBarProps {
  /** Small uppercase eyebrow like "Your Selection". */
  label: string;
  /** Summary line, e.g. "Reserving for 2 Guests on Jun 4". */
  summary: ReactNode;
  /** Optional trailing image chip. */
  imageUrl?: string;
  imageAlt?: string;
  ctaLabel: string;
  onCta: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Sticky bottom bar (mobile booking mockup): summary + primary CTA. */
export function MobileActionBar({
  label,
  summary,
  imageUrl,
  imageAlt = "Preview",
  ctaLabel,
  onCta,
  disabled,
  loading,
}: MobileActionBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t-4 border-on-surface bg-surface-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(255,107,74,0.15)] md:hidden">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="font-label-bold text-[12px] uppercase tracking-tight text-primary">{label}</span>
            <p className="truncate font-headline-md leading-tight text-on-surface">{summary}</p>
          </div>
          {imageUrl && (
            <div className="h-12 w-12 flex-shrink-0 rotate-3 overflow-hidden rounded-full border-2 border-on-surface shadow-sm">
              <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCta}
          disabled={disabled || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-on-surface bg-primary-container py-4 font-headline-md text-headline-md text-on-primary shadow-[4px_4px_0_#231a11] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#231a11] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="material-symbols-outlined animate-spin text-base"
                style={{ animationDuration: "1.1s" }}
              >
                progress_activity
              </span>
              Working…
            </>
          ) : (
            <>
              {ctaLabel}
              <Icon name="arrow_forward" size="sm" />
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
