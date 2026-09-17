import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Branded page header: eyebrow pill + Fredoka title + optional subtitle. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-12", className)}>
      {eyebrow && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-secondary-container px-4 py-1.5 font-label-bold text-label-bold uppercase text-on-secondary-container shadow-[2px_2px_0_#231a11]">
          <Icon name="auto_awesome" size="sm" />
          {eyebrow}
        </p>
      )}
      <h1 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
        {title}
      </h1>
      {subtitle && <p className="mt-4 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{subtitle}</p>}
    </header>
  );
}

/** Branded loading state — text label, never icon-only (UI/UX §5). */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="material-symbols-outlined animate-spin text-primary"
          style={{ animationDuration: "1.2s" }}
        >
          progress_activity
        </span>
        <span className="font-label-bold text-label-bold uppercase text-on-surface-variant">{label}…</span>
      </div>
    </div>
  );
}

/** Suspense fallback shared by the route layouts — branded, text-labeled. */
export function PageFallback() {
  return <LoadingState label="Firing up the ovens" />;
}

/** Branded error state with retry (UI/UX §5 — plain text, no icon-only). */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-on-surface bg-surface-white p-10 text-center shadow-[4px_4px_0_#231a11]">
      <span className="font-headline-md text-headline-md text-on-surface">Well, that crumbled.</span>
      <p className="max-w-md font-body-md text-on-surface-variant">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[4px_4px_0_#231a11] transition-all hover:bg-primary hover:text-on-primary"
        >
          <Icon name="refresh" size="sm" /> Try again
        </button>
      )}
    </div>
  );
}
