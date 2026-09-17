import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PageFallback } from "@/components/PageStates";
import { PageTransition } from "@/components/motion/PageTransition";
import { fetchBusinessHours, fetchSiteSettings } from "@/lib/api";
import type { BusinessHours, SiteSettings } from "@/lib/content";
import { DAY_NAMES, formatTime } from "@/lib/format";

const navItems = [
  { to: "/menu", label: "Menu", icon: "restaurant_menu" },
  { to: "/catering", label: "Catering", icon: "bakery_dining" },
  { to: "/gallery", label: "Gallery", icon: "photo_library" },
  { to: "/events", label: "Events", icon: "celebration" },
  { to: "/about", label: "About", icon: "info" },
  { to: "/contact", label: "Contact", icon: "mail" },
];

function BrandLockup({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="Crumb and Confetti home">
      <Icon name="cake" className="text-primary" size="md" />
      <span className="font-headline-md text-headline-md font-bold leading-none tracking-tight text-on-surface">
        CRUMB &amp; CONFETTI
      </span>
    </Link>
  );
}

/* ── Desktop side nav ─────────────────────────────────────────────── */

function SideNav() {
  return (
    <nav className="fixed left-0 top-0 z-50 hidden h-full w-[240px] flex-col justify-between border-r-2 border-on-surface bg-background-cream p-gutter md:flex">
      <div>
        <Link
          to="/"
          className="group mb-12 flex flex-col items-center text-center"
          aria-label="Crumb and Confetti home"
        >
          <Icon
            name="cake"
            size="xl"
            className="mb-2 text-primary transition-transform duration-500 ease-out group-hover:-rotate-12"
          />
          <span className="font-headline-md text-headline-md font-bold leading-none tracking-tight text-on-surface">
            CRUMB &amp; CONFETTI
          </span>
        </Link>
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-4 rounded-lg px-4 py-3 transition-transform duration-200 hover:translate-x-0.5",
                    isActive ? "font-bold text-primary" : "font-bold text-on-surface hover:bg-primary-container/10"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Springy pill that follows the active link */}
                    {isActive && (
                      <motion.span
                        layoutId="sidenav-active-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-lg border-2 border-on-surface bg-primary-container/25"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-4">
                      <Icon name={item.icon} size="sm" />
                      <span className="font-label-bold text-label-bold uppercase">{item.label}</span>
                    </span>
                    <Icon
                      name="arrow_forward"
                      size="sm"
                      className="relative z-10 ml-auto opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <Link
          to="/book"
          className="group flex items-center justify-center gap-2 rounded-[20px] border-2 border-on-surface bg-on-surface py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary active:translate-y-0.5 active:shadow-[2px_2px_0_#231a11]"
        >
          Book Table
          <Icon name="arrow_forward" size="sm" className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </nav>
  );
}

/* ── Mobile drawer ────────────────────────────────────────────────── */

const drawerItems: Array<{ to: string; label: string; icon: string; end?: boolean }> = [
  { to: "/", label: "Home", icon: "home", end: true },
  ...navItems,
];

const drawerSocials = [
  { label: "Instagram", icon: "photo_camera", href: "https://instagram.com/crumbandconfetti" },
  { label: "Facebook", icon: "thumb_up", href: "https://facebook.com/crumbandconfetti" },
  { label: "TikTok", icon: "music_note", href: "https://tiktok.com/@crumbandconfetti" },
];

/** Entrance/exit orchestration — links cascade in, then recede on close. */
const drawerListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.14 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const drawerItemVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 27 } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.14 } },
};

/** Tiny confetti sprinkle — on-brand, purely decorative. */
function ConfettiSprinkle() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-1.5 py-3">
      <span className="h-2 w-2 rotate-45 rounded-[2px] bg-primary" />
      <span className="h-2 w-2 rounded-full bg-secondary-container" />
      <span className="h-2.5 w-2.5 -rotate-12 rounded-[3px] bg-tertiary-container" />
      <span className="h-2 w-2 rotate-12 rounded-[2px] bg-primary-container" />
      <span className="h-2 w-2 rounded-full bg-on-surface/25" />
    </div>
  );
}

/** Mobile hamburger drawer — a springy right-side panel with a blur backdrop. */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const close = useCallback(() => {
    setOpen(false);
    // Restore focus to the hamburger trigger (matches GalleryLightbox pattern).
    triggerRef.current?.focus();
  }, []);

  // Close whenever the route changes (covers the browser back button too).
  // If the drawer was open, hand focus to the new page so keyboard users
  // aren't stranded on an unmounted element.
  useEffect(() => {
    setOpen((wasOpen) => {
      if (wasOpen) document.getElementById("main-content")?.focus({ preventScroll: true });
      return false;
    });
  }, [location.pathname]);

  // Lock body scroll while open; close on Escape; trap focus inside the dialog.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Move focus into the dialog the moment it opens.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-transform hover:scale-105 active:translate-y-0.5 active:shadow-none"
      >
        <Icon name="menu" size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer-backdrop"
            aria-hidden="true"
            onClick={close}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25 }}
            className="fixed inset-0 z-[95] bg-on-surface/40 backdrop-blur-sm"
          />
        )}
        {open && (
          <motion.div
            key="drawer-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { x: 0 } : { x: "100%" }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 42 }
            }
            className="fixed inset-y-0 right-0 z-[100] flex w-[88%] max-w-[360px] flex-col border-l-2 border-on-surface bg-background-cream shadow-[-10px_0_30px_rgba(35,26,17,0.18)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-on-surface px-5 py-4">
              <BrandLockup />
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-transform duration-200 hover:rotate-90 hover:scale-105 active:translate-y-0.5 active:shadow-none"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <ConfettiSprinkle />

            {/* Staggered nav links — the active pill springs in once at open
                (the drawer closes on navigation, so it doesn't slide between items) */}
            <nav aria-label="Site menu" className="flex-1 overflow-y-auto px-5 pb-4">
              <motion.ul
                variants={drawerListVariants}
                initial={reduce ? "show" : "hidden"}
                animate="show"
                exit={reduce ? undefined : "exit"}
                className="flex flex-col gap-2"
              >
                {drawerItems.map((item) => (
                  <motion.li
                    key={item.to}
                    variants={drawerItemVariants}
                    className="list-none"
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-4 rounded-xl px-5 py-4 transition-colors",
                          isActive ? "text-on-surface" : "text-on-surface hover:bg-primary-container/10"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Springy active pill — slides between items */}
                          {isActive && (
                            <motion.span
                              layoutId="drawer-active-pill"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-xl border-2 border-on-surface bg-primary-container/25"
                            />
                          )}
                          <span className="relative z-10 flex flex-1 items-center gap-4">
                            <Icon name={item.icon} size="sm" className={cn(isActive && "text-primary")} />
                            <span className="font-label-bold text-label-bold uppercase">{item.label}</span>
                            <Icon
                              name="arrow_forward"
                              size="sm"
                              className={cn(
                                "ml-auto transition-all duration-200 group-hover:translate-x-0.5",
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                            />
                          </span>
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </motion.ul>
            </nav>

            {/* Footer: socials + top task CTA */}
            <div className="border-t-2 border-on-surface px-5 py-5">
              <div className="mb-4 flex items-center justify-center gap-2">
                {drawerSocials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${s.label} (opens in a new tab)`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-all hover:-translate-y-0.5 hover:bg-secondary-container active:translate-y-0"
                  >
                    <Icon name={s.icon} size="sm" />
                  </a>
                ))}
              </div>
              <Link
                to="/book"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-[20px] border-2 border-on-surface bg-primary py-4 font-label-bold text-label-bold uppercase text-on-primary shadow-[4px_4px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary-container hover:text-on-primary-container active:translate-y-0.5 active:shadow-[2px_2px_0_#231a11]"
              >
                <Icon name="event_seat" size="sm" /> Book a Table
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TopNav() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b-2 border-on-surface bg-background-cream px-margin-mobile py-unit md:hidden">
      <BrandLockup />
      <div className="flex items-center gap-3">
        <Link
          to="/book"
          className="rounded-full border-2 border-on-surface bg-primary px-4 py-2 font-label-bold text-label-bold uppercase text-on-primary transition-all hover:bg-primary-container active:translate-y-0.5"
        >
          Book
        </Link>
        <MobileMenu />
      </div>
    </nav>
  );
}

/* ── Footer: utility + conversion hub ─────────────────────────────── */

function FooterHours({ hours }: { hours: BusinessHours[] }) {
  if (hours.length === 0) {
    return <p className="font-body-sm text-on-surface-variant">Hours coming soon.</p>;
  }
  const today = new Date().getDay();
  return (
    <ul className="space-y-1.5">
      {hours.map((h) => {
        const isToday = h.day_of_week === today;
        return (
          <li
            key={h.day_of_week}
            className={cn(
              "flex items-center justify-between gap-4 font-body-sm",
              isToday ? "font-bold text-on-surface" : "text-on-surface-variant"
            )}
          >
            <span>
              {DAY_NAMES[h.day_of_week]}
              {isToday && <span className="sr-only"> (today)</span>}
            </span>
            <span className={cn(isToday && "flex items-center gap-1.5")}>
              {isToday && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success-mint" />}
              {h.is_closed ? "Closed" : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function FooterSocials({ settings }: { settings: SiteSettings | null }) {
  const socials = settings?.social_links ?? {};
  const items = [
    { key: "instagram", label: "Instagram", icon: "photo_camera", href: socials.instagram },
    { key: "facebook", label: "Facebook", icon: "thumb_up", href: socials.facebook },
    { key: "tiktok", label: "TikTok", icon: "music_note", href: socials.tiktok },
  ].filter((s) => s.href);

  return (
    <div className="flex gap-2">
      {items.length > 0 ? (
        items.map((s) => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${s.label} (opens in a new tab)`}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface bg-surface-white shadow-[2px_2px_0_#231a11] transition-all hover:-translate-y-0.5 hover:bg-secondary-container"
          >
            <Icon name={s.icon} size="sm" />
          </a>
        ))
      ) : (
        <p className="font-body-sm text-on-surface-variant">@crumbandconfetti</p>
      )}
    </div>
  );
}

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [s, h] = await Promise.all([fetchSiteSettings(), fetchBusinessHours()]);
      if (cancelled) return;
      setSettings(s);
      setHours(h);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="mt-16 border-t-2 border-on-surface pb-20 md:pb-0">
      {/* Book CTA band — warm gradient */}
      <div className="sunset-gradient px-margin-mobile py-12 md:px-margin-desktop">
        <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Got a sweet tooth calling?</h2>
            <p className="font-body-md text-on-surface/80">
              Reserve your table in under a minute — no phone tag required.
            </p>
          </div>
          <Link
            to="/book"
            className="group inline-flex items-center gap-2 rounded-[20px] border-2 border-on-surface bg-on-surface px-8 py-4 font-label-bold text-label-bold uppercase text-surface-white shadow-[6px_6px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-primary active:translate-y-0.5 active:shadow-[3px_3px_0_#231a11]"
          >
            Book a Table
            <Icon
              name="arrow_forward"
              size="sm"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      {/* Slim newsletter band */}
      <div className="bg-on-surface text-background-cream">
        <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-5 border-b border-background-cream/15 px-margin-mobile py-10 md:flex-row md:px-margin-desktop">
          <div className="max-w-md text-center md:text-left">
            <p className="font-label-bold text-label-bold uppercase tracking-widest text-secondary-container">
              Join the sprinkle list
            </p>
            <p className="mt-1 font-body-sm text-background-cream/70">
              New bakes, events &amp; secret menu drops — straight to your inbox.
            </p>
          </div>
          <NewsletterForm className="max-w-md" />
        </div>
      </div>

      {/* Main footer grid — 3 clean columns */}
      <div className="footer-wash text-background-cream">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-12 px-margin-mobile py-14 sm:grid-cols-2 lg:grid-cols-12 md:px-margin-desktop">
          {/* Brand + socials */}
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="cake" className="text-primary-container" size="md" />
              <span className="font-headline-md text-headline-md font-bold leading-none tracking-tight">
                CRUMB &amp; CONFETTI
              </span>
            </div>
            <p className="mb-6 max-w-xs font-body-sm text-background-cream/70">
              {settings?.description ?? "Artisanal pastries, craft coffee, and a daily dose of celebration."}
            </p>
            <FooterSocials settings={settings} />
          </div>

          {/* Explore — nav only (legal links live in the bottom bar) */}
          <nav className="lg:col-span-3" aria-label="Footer navigation">
            <h3 className="mb-5 font-label-bold text-label-bold uppercase tracking-widest text-secondary-container">
              Explore
            </h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="group inline-flex items-center gap-2 font-body-sm text-background-cream/80 transition-colors hover:text-primary-container"
                  >
                    {/* Reserved arrow slot so labels don't shift on hover */}
                    <span aria-hidden="true" className="flex w-5 items-center justify-center">
                      <Icon
                        name="arrow_forward"
                        size="sm"
                        className="text-primary-container opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Visit + Hours */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <h3 className="mb-5 font-label-bold text-label-bold uppercase tracking-widest text-secondary-container">
                  Visit us
                </h3>
                <address className="space-y-3 font-body-sm not-italic text-background-cream/80">
                  <p className="flex items-start gap-2">
                    <Icon name="location_on" size="sm" className="mt-0.5 text-primary-container" />
                    <span>
                      {settings?.address}, {settings?.city}
                    </span>
                  </p>
                  <p>
                    <a
                      href={`tel:${settings?.phone}`}
                      className="flex items-center gap-2 transition-colors hover:text-primary-container"
                    >
                      <Icon name="call" size="sm" className="text-primary-container" /> {settings?.phone}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`mailto:${settings?.email}`}
                      className="flex items-center gap-2 break-all transition-colors hover:text-primary-container"
                    >
                      <Icon name="mail" size="sm" className="text-primary-container" /> {settings?.email}
                    </a>
                  </p>
                </address>
              </div>
              <div>
                <h3 className="mb-5 font-label-bold text-label-bold uppercase tracking-widest text-secondary-container">
                  Hours
                </h3>
                <FooterHours hours={hours} />
                <p className="mt-4 flex items-center gap-2 font-body-sm text-background-cream/70">
                  <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-success-mint" />
                  Kitchen is LIVE
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div className="border-t border-background-cream/15">
          <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-3 px-margin-mobile py-6 font-body-sm text-background-cream/60 sm:flex-row md:px-margin-desktop">
            <p>© 2026 Crumb &amp; Confetti. All rights sprinkled with joy.</p>
            <nav className="flex items-center gap-5" aria-label="Legal">
              <Link to="/privacy" className="transition-colors hover:text-primary-container">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-primary-container">
                Terms
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 transition-colors hover:text-primary-container"
                title="Admin dashboard"
              >
                <Icon name="settings" size="sm" /> Staff
              </Link>
            </nav>
            <p className="flex items-center gap-1.5">
              Baked with <Icon name="favorite" size="sm" className="text-tertiary-container" /> in Brooklyn
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Mobile sticky Book CTA ────────────────────────────────────────── */

function StickyMobileCta() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-on-surface bg-surface-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <Link
        to="/book"
        className="flex items-center justify-center gap-2 rounded-[20px] border-2 border-on-surface bg-primary-container py-3.5 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_#231a11]"
      >
        <Icon name="event_seat" size="sm" /> Book a Table
      </Link>
    </div>
  );
}

/** Public site shell: desktop side nav + mobile top nav + content + footer. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background-cream font-body-md text-on-surface antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:border-2 focus:border-on-surface focus:bg-primary-container focus:px-4 focus:py-2 focus:font-label-bold focus:text-label-bold focus:uppercase"
      >
        Skip to main content
      </a>
      <SideNav />
      <TopNav />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-20 pb-24 focus:outline-none md:ml-[240px] md:pb-0 md:pt-0">
        {/* Suspense keeps the nav/footer visible while a lazy chunk loads;
            PageTransition cross-fades between pages on route change */}
        <PageTransition>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  );
}
