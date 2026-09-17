import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/ui/Icon";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, opts?: { detail?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the admin toast — `toast("Seated!", { detail: "Table 12 updated." })`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const toneStyles: Record<ToastTone, { icon: string; iconBg: string; iconColor: string }> = {
  success: { icon: "done", iconBg: "bg-success-mint", iconColor: "text-white" },
  error: { icon: "close", iconBg: "bg-error-red", iconColor: "text-white" },
  info: { icon: "auto_awesome", iconBg: "bg-primary-container", iconColor: "text-on-primary-container" },
};

/** Branded toast stack — bottom-right, espresso border, offset shadow. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const reduce = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (message, opts) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, detail: opts?.detail, tone: opts?.tone ?? "success" }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-24 right-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 md:bottom-8 md:right-8">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = toneStyles[t.tone];
            return (
              <motion.div
                key={t.id}
                initial={reduce ? false : { opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: 60 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="pointer-events-auto flex items-center gap-3 rounded-xl radical-border bg-surface-white p-4 radical-shadow"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-on-surface ${style.iconBg} ${style.iconColor}`}>
                  <Icon name={style.icon} size="sm" />
                </span>
                <div className="min-w-0">
                  <p className="font-label-bold text-label-bold uppercase text-on-surface">{t.message}</p>
                  {t.detail && <p className="truncate font-body-sm text-on-surface-variant">{t.detail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="ml-auto shrink-0 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <Icon name="close" size="sm" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
