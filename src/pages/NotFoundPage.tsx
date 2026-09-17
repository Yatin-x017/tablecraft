import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { usePageMeta } from "@/lib/seo";

const quickLinks = [
  { to: "/menu", label: "Menu", icon: "restaurant_menu" },
  { to: "/catering", label: "Catering", icon: "bakery_dining" },
  { to: "/gallery", label: "Gallery", icon: "photo_library" },
  { to: "/events", label: "Events", icon: "celebration" },
  { to: "/about", label: "About", icon: "info" },
  { to: "/contact", label: "Contact", icon: "mail" },
];

/**
 * The "0" in 404 — a bitten cookie with crumbs escaping the bite,
 * drawn in brand colors to match the hand-drawn mockup style.
 */
function CookieZero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="0" className={className}>
      <defs>
        <mask id="cc-cookie-bite">
          <rect width="120" height="120" fill="#fff" />
          <circle cx="102" cy="20" r="22" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#cc-cookie-bite)">
        <circle cx="60" cy="60" r="48" fill="#f8e5d6" stroke="#231a11" strokeWidth="4" />
        <circle cx="42" cy="44" r="6" fill="#231a11" />
        <circle cx="70" cy="38" r="5" fill="#231a11" />
        <circle cx="56" cy="68" r="7" fill="#231a11" />
        <circle cx="34" cy="74" r="4.5" fill="#231a11" />
        <circle cx="76" cy="82" r="5" fill="#231a11" />
      </g>
      {/* crumbs */}
      <circle cx="104" cy="32" r="4" fill="#f8e5d6" stroke="#231a11" strokeWidth="2.5" />
      <circle cx="114" cy="44" r="3" fill="#fdc73a" stroke="#231a11" strokeWidth="2" />
      <circle cx="102" cy="12" r="2.5" fill="#ff6586" stroke="#231a11" strokeWidth="2" />
    </svg>
  );
}

/** Gentle float for the cookie, disabled under prefers-reduced-motion. */
function FloatCookie({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={className}
      initial={false}
      animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, -4, 0] }}
      transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
    >
      <CookieZero className="h-full w-auto" />
    </motion.span>
  );
}

/**
 * Public 404 (UI/UX §5) — whimsical "this page crumbled" screen with the
 * brand CTA trio and quick links, so a dead end still converts.
 */
export function NotFoundPage() {
  usePageMeta(
    "Page Not Found",
    "This page crumbled — head back to Crumb & Confetti for pastries, coffee, and celebration."
  );

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-margin-mobile py-24">
      {/* Decorative sprinkle wash + corner doodles (from the hero mockup) */}
      <div aria-hidden="true" className="sprinkle-pattern pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="absolute left-8 top-24 -rotate-12 text-primary opacity-40 md:left-16">
        <Icon name="star" size="lg" />
      </div>
      <div aria-hidden="true" className="absolute right-10 top-32 rotate-12 text-secondary opacity-40 md:right-24">
        <Icon name="auto_awesome" size="md" />
      </div>
      <div aria-hidden="true" className="absolute bottom-16 left-16 hidden rotate-6 text-tertiary opacity-40 md:block">
        <Icon name="cake" size="lg" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* 404 display — the zero is a bitten cookie */}
        <div
          aria-hidden="true"
          className="mb-8 flex select-none items-end justify-center gap-1 font-display leading-none text-on-surface"
        >
          <span className="text-[clamp(88px,20vw,150px)]">4</span>
          <FloatCookie className="h-[clamp(72px,17vw,128px)] pb-2" />
          <span className="text-[clamp(88px,20vw,150px)]">4</span>
        </div>

        <h1 className="mb-4 font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
          This page crumbled
        </h1>
        <p className="mx-auto mb-10 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
          The page you&rsquo;re after isn&rsquo;t on today&rsquo;s menu — it may have been eaten, moved, or never
          baked. Let&rsquo;s get you back to the good stuff.
        </p>

        {/* Brand CTA trio */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-colors hover:bg-primary"
          >
            <Icon name="home" size="sm" /> Back to Home
          </Link>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-md border-2 border-on-surface bg-secondary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-surface shadow-[4px_4px_0_#231a11] transition-colors hover:bg-surface-container"
          >
            <Icon name="restaurant_menu" size="sm" /> Browse the Menu
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-md border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[4px_4px_0_#231a11] transition-colors hover:bg-primary hover:text-on-primary"
          >
            <Icon name="event_seat" size="sm" /> Book a Table
          </Link>
        </div>

        {/* Quick links to the popular pages */}
        <Card className="mx-auto max-w-xl p-8">
          <p className="mb-5 font-label-bold text-label-bold uppercase tracking-widest text-primary">
            Popular pit stops
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="radical-shadow-sm inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-surface-white px-4 py-2 font-label-bold text-label-bold uppercase text-on-surface transition-colors hover:bg-secondary-container"
                >
                  <Icon name={l.icon} size="sm" /> {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
