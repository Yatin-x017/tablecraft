import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  /** "+12%" (up=good) or "−2%" (down=bad) */
  deltaTone: "up" | "down";
  icon: string;
  iconBg: string;
  iconColor: string;
  /** Bar-chart sparkline heights (0–100). */
  bars: number[];
  barColor: string;
}

/** Dashboard bento stat card — sprinkle pattern + mini bar chart. */
export function StatCard({ label, value, delta, deltaTone, icon, iconBg, iconColor, bars, barColor }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] radical-border bg-surface-white p-6 radical-shadow transition-transform duration-200 hover:-translate-y-1">
      <div className="sprinkle-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface", iconBg)}>
            <Icon name={icon} size="sm" className={iconColor} />
          </span>
        </div>
        <div className="mb-6 flex items-baseline gap-2">
          <span className="font-display text-display text-on-surface">{value}</span>
          <span className={cn("font-label-bold text-label-bold", deltaTone === "up" ? "text-success-mint" : "text-error-red")}>
            {delta}
          </span>
        </div>
        <div className="flex h-24 w-full items-end gap-1" aria-hidden="true">
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn("flex-1 rounded-t-sm transition-all duration-300 group-hover:opacity-100", barColor)}
              style={{
                height: `${h}%`,
                opacity: i === bars.length - 1 ? 1 : 0.35 + (i / bars.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SparkProps {
  label: string;
  value: string;
  suffix?: string;
  emoji: string;
  /** 0–100 progress width. */
  pct: number;
  barClass: string;
}

/** Leaderboard progress row (Top Treats). */
export function SparkRow({ label, value, suffix = "sold", emoji, pct, barClass }: SparkProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-label-bold text-on-surface">
          <span className="mr-2" aria-hidden="true">{emoji}</span>
          {label}
        </span>
        <span className="font-body-sm font-bold text-on-surface-variant">
          {value} {suffix}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full radical-border bg-surface-container">
        <div className={cn("h-full rounded-full transition-all duration-1000", barClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Reusable section shell for admin panels. */
export function AdminSection({ title, subtitle, actions, children }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[32px] radical-border bg-surface-white radical-shadow">
      <div className="flex flex-col justify-between gap-4 border-b-2 border-on-surface bg-surface-container-low p-6 md:flex-row md:items-center md:p-8">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
          {subtitle && <p className="mt-1 font-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Small bordered action button used across admin lists. */
export function AdminActionButton({
  children,
  onClick,
  tone = "neutral",
  icon,
  ariaLabel,
}: {
  children?: ReactNode;
  onClick?: () => void;
  tone?: "neutral" | "danger" | "success";
  icon?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-on-surface px-3 py-1.5 font-label-bold text-label-bold uppercase radical-shadow-sm radical-button-press transition-colors",
        tone === "danger" && "bg-surface-white text-error-red hover:bg-error-container",
        tone === "success" && "bg-success-mint text-on-surface hover:brightness-95",
        tone === "neutral" && "bg-surface-container text-on-surface hover:bg-surface-container-high"
      )}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </button>
  );
}
