import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/**
 * Newsletter capture (PRD §6.1 — P1). Email-only; stored for the owner's
 * own use. No ESP integration in v1 — this just validates + confirms.
 */
export function NewsletterForm({ className, compact }: { className?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    // No backend in v1 — simulate a short submit so the confirmation feels real.
    window.setTimeout(() => {
      setStatus("done");
      setEmail("");
    }, 600);
  };

  if (status === "done") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-xl border-2 border-on-surface bg-success-mint/20 px-4 py-3 font-label-bold text-label-bold uppercase text-on-surface",
          className
        )}
      >
        <Icon name="check_circle" size="sm" className="text-success-mint" />
        You're on the list — sweet!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <div className={cn("flex gap-2", compact ? "flex-col" : "flex-col sm:flex-row")}>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="sweetness@bakery.com"
          aria-invalid={status === "error"}
          className={cn(
            "h-12 flex-1 rounded-xl border-2 bg-surface-white px-4 font-body-md text-on-surface",
            "placeholder:text-on-surface-variant/50 transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115]",
            status === "error" ? "border-error-red" : "border-on-surface"
          )}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-on-surface bg-primary-container px-6 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all hover:bg-primary hover:text-on-primary disabled:opacity-60"
        >
          {status === "submitting" ? "Joining…" : "Join"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 font-body-sm text-error-red" role="alert">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
