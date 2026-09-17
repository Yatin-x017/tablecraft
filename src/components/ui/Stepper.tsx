import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** 0-based index of the current (active) step. */
  current: number;
  className?: string;
}

/**
 * Horizontal reservation-flow stepper (from the booking mockup):
 * numbered circles with tactile borders, connectors between them.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center justify-center", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={step.label} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn("mx-2 h-1 w-12 rounded-full", state === "upcoming" ? "bg-outline-variant" : "bg-primary-container")}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full font-label-bold",
                  state === "active" && "tactile-border bg-primary-container text-on-primary-container ring-4 ring-primary-container/20",
                  state === "done" && "radical-border bg-secondary-container text-on-secondary-container",
                  state === "upcoming" && "border-2 border-outline-variant bg-surface-white text-on-surface-variant"
                )}
              >
                {state === "done" ? (
                  <span aria-hidden="true" className="material-symbols-outlined text-base">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "font-label-bold text-label-bold uppercase",
                  state === "active" ? "text-primary" : "text-on-surface-variant"
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
