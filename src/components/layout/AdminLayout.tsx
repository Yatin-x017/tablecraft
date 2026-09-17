import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { PageFallback } from "@/components/PageStates";
import { PageTransition } from "@/components/motion/PageTransition";
import { usePageMeta } from "@/lib/seo";
import { useAdminAuth } from "@/lib/adminAuth";
import { useAdminStore } from "@/store/useAdminStore";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/menu", label: "Menu", icon: "bakery_dining" },
  { to: "/admin/reservations", label: "Reservations", icon: "event_seat" },
  { to: "/admin/floor", label: "Floor Setup", icon: "table_restaurant" },
  { to: "/admin/gallery", label: "Gallery", icon: "photo_library" },
  { to: "/admin/blog", label: "Blog & Events", icon: "celebration" },
  { to: "/admin/hours", label: "Hours & Holidays", icon: "schedule" },
  { to: "/admin/testimonials", label: "Testimonials", icon: "rate_review" },
  { to: "/admin/settings", label: "Settings", icon: "settings" },
];

/** Desktop sidebar — persistent, full-height. */
function Sidebar() {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col justify-between border-r-2 border-on-surface bg-background-cream p-gutter md:flex">
      <div>
        <div className="mb-10">
          <h1 className="font-headline-md text-headline-md font-extrabold leading-none tracking-tighter text-on-surface">
            CRUMB &amp;
            <br />
            CONFETTI
          </h1>
          <p className="mt-1 font-body-sm opacity-70">Baked with Joy</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin sections">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-lg px-4 py-3 transition-all",
                  isActive
                    ? "radical-border radical-shadow-sm bg-primary-container font-bold text-on-primary-container"
                    : "text-on-surface hover:bg-primary-container/10"
                )
              }
            >
              <Icon name={item.icon} size="sm" />
              <span className="font-label-bold text-label-bold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-3">
        {/* Signed-in staff chip */}
        {user && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-on-surface bg-surface-container-low px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container font-bold text-on-surface">
              {(user.fullName ?? user.email ?? "A").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-label-bold text-label-bold text-on-surface">{user.fullName ?? "Staff"}</p>
              <p className="truncate text-[11px] font-label-bold uppercase text-on-surface-variant">
                {user.role}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 rounded-[20px] border-2 border-on-surface bg-surface-white py-3 font-label-bold text-label-bold uppercase transition-all hover:bg-surface-container"
        >
          <Icon name="logout" size="sm" />
          Sign out
        </button>
        <NavLink
          to="/"
          className="flex items-center justify-center gap-2 rounded-[20px] border-2 border-on-surface bg-surface-white py-3 shadow-[4px_4px_0_#231a11] transition-all hover:bg-surface-container"
        >
          <Icon name="arrow_back" size="sm" />
          <span className="font-label-bold text-label-bold uppercase">Back to Site</span>
        </NavLink>
      </div>
    </aside>
  );
}

/** Mobile nav — animated right-side drawer with blur backdrop. */
function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    close();
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll + Escape + focus trap while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin navigation"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-11 w-11 list-none cursor-pointer items-center justify-center rounded-xl border-2 border-on-surface bg-surface-white radical-shadow-sm transition-transform active:scale-95"
      >
        <Icon name="menu" size="md" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="admin-drawer-backdrop"
            aria-hidden="true"
            onClick={close}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25 }}
            className="fixed inset-0 z-[95] bg-on-surface/40 backdrop-blur-sm"
          />
        )}
        {open && (
          <motion.div
            key="admin-drawer-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: "100%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 42 }}
            className="fixed inset-y-0 right-0 z-[100] flex w-[86%] max-w-[320px] flex-col border-l-2 border-on-surface bg-background-cream shadow-[-10px_0_30px_rgba(35,26,17,0.18)]"
          >
            <div className="flex items-center justify-between border-b-2 border-on-surface px-5 py-4">
              <div>
                <p className="font-headline-md text-headline-md font-extrabold leading-none tracking-tighter text-on-surface">
                  CRUMB &amp; CONFETTI
                </p>
                <p className="text-[11px] font-label-bold uppercase text-primary">Admin CMS</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close admin navigation"
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-on-surface bg-surface-white radical-shadow-sm transition-transform hover:rotate-90 hover:scale-105 active:translate-y-0.5 active:shadow-none"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <nav aria-label="Admin sections (mobile)" className="flex-1 overflow-y-auto px-3 py-4">
              {adminNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors",
                      isActive
                        ? "radical-border radical-shadow-sm bg-primary-container font-bold text-on-primary-container"
                        : "text-on-surface hover:bg-surface-container"
                    )
                  }
                >
                  <Icon name={item.icon} size="sm" />
                  <span className="font-label-bold text-label-bold">{item.label}</span>
                </NavLink>
              ))}
              {user && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-on-surface bg-surface-container-low px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container font-bold text-on-surface">
                    {(user.fullName ?? user.email ?? "A").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-label-bold text-label-bold text-on-surface">
                      {user.fullName ?? "Staff"}
                    </p>
                    <p className="truncate text-[11px] font-label-bold uppercase text-on-surface-variant">{user.role}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center gap-3 rounded-xl border-2 border-on-surface bg-surface-white px-4 py-3.5 text-on-surface transition-colors hover:bg-error-container hover:text-error-red"
              >
                <Icon name="logout" size="sm" />
                <span className="font-label-bold text-label-bold uppercase">Sign out</span>
              </button>
              <NavLink
                to="/"
                onClick={close}
                className="mt-3 flex items-center gap-3 rounded-xl border-t-2 border-dashed border-outline-variant px-4 py-3.5 text-on-surface transition-colors hover:bg-surface-container"
              >
                <Icon name="arrow_back" size="sm" />
                <span className="font-label-bold text-label-bold uppercase">Back to Site</span>
              </NavLink>
            </nav>
            <div aria-hidden="true" className="flex items-center justify-center gap-1.5 border-t-2 border-on-surface py-3">
              <span className="h-2 w-2 rotate-45 rounded-[2px] bg-primary" />
              <span className="h-2 w-2 rounded-full bg-secondary-container" />
              <span className="h-2.5 w-2.5 -rotate-12 rounded-[3px] bg-tertiary-container" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Admin CMS shell: persistent sidebar (desktop) + animated drawer (mobile). */
export function AdminLayout() {
  const { pathname } = useLocation();
  const { status } = useAdminAuth();
  const hydrate = useAdminStore((s) => s.hydrate);
  const subscribeReservations = useAdminStore((s) => s.subscribeReservations);
  const unsubscribeReservations = useAdminStore((s) => s.unsubscribeReservations);
  const active = adminNav.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));
  usePageMeta(active?.label ?? "Dashboard", "Crumb & Confetti admin CMS.");

  // Resolve the session on first mount (direct visit / refreshed tab).
  useEffect(() => {
    void useAdminAuth.getState().init();
  }, []);

  // Once signed in: swap the demo seeds for live Supabase rows and open the
  // reservations realtime channel (doc §8). The effect cleanup tears the
  // channel down when the layout unmounts — i.e. on sign-out → /admin/login.
  useEffect(() => {
    if (status !== "authed") return;
    void hydrate();
    subscribeReservations();
    return () => unsubscribeReservations();
  }, [status, hydrate, subscribeReservations, unsubscribeReservations]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-cream">
        <PageFallback />
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background-cream font-body-md text-on-surface antialiased">
      <Sidebar />

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b-2 border-on-surface bg-background-cream px-4 py-3 md:hidden">
        <div>
          <p className="font-headline-md text-headline-md font-extrabold leading-none tracking-tighter text-on-surface">
            CRUMB &amp; CONFETTI
          </p>
          <p className="text-[11px] font-label-bold uppercase text-primary">Admin CMS</p>
        </div>
        <MobileNav />
      </div>

      <main className="w-full pt-[70px] md:ml-[240px] md:pt-0">
        {/* Suspense keeps the sidebar/top bar visible while a lazy chunk loads;
            PageTransition cross-fades between admin pages on route change */}
        <PageTransition>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
    </div>
  );
}
