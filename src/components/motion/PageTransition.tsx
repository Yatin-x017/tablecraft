import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Route-level page transition (UI/UX §7): fade + slide on every route change,
 * keyed by pathname so AnimatePresence can cross-fade. Runs in ~250 ms and
 * respects prefers-reduced-motion.
 *
 * Scrolling: the entering page scrolls to the top the moment it mounts —
 * after the exit completes (mode="wait") — replacing the old instant
 * ScrollToTop, which would have jumped the exiting page mid-animation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <ScrollToTopOnMount />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Scrolls the newly-mounted page to the top (after the exit completes). */
function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  return null;
}
