import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { usePageMeta } from "@/lib/seo";

const quickLinks = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/reservations", label: "Reservations", icon: "event_seat" },
  { to: "/admin/menu", label: "Menu", icon: "bakery_dining" },
  { to: "/admin/floor", label: "Floor Setup", icon: "table_restaurant" },
  { to: "/admin/hours", label: "Hours & Holidays", icon: "schedule" },
  { to: "/admin/settings", label: "Settings", icon: "settings" },
];

/** Monospace "url chip" so staff can see exactly which path 404'd. */
function PathChip({ path }: { path: string }) {
  return (
    <code className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-lg border-2 border-on-surface bg-surface-container px-3 py-1.5 font-body-sm whitespace-nowrap text-on-surface-variant hide-scrollbar">
      <Icon name="link_off" size="sm" className="shrink-0 text-primary" />
      {path}
    </code>
  );
}

/**
 * Admin 404 — renders INSIDE the admin layout (auth gate still applies),
 * styled like the CMS: quieter than the public page, "recipe not found"
 * theme, with staff quick links and the attempted path shown.
 */
export function AdminNotFoundPage() {
  const { pathname } = useLocation();
  usePageMeta("Not Found — Admin", "The admin page you were looking for doesn't exist.");

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-gutter py-16">
      <div aria-hidden="true" className="doodle-bg-dots pointer-events-none absolute inset-0" />

      <Card className="relative z-10 w-full max-w-xl p-10 text-center">
        {/* Badge row */}
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-secondary-container px-4 py-1.5 font-label-bold text-label-bold uppercase text-on-secondary-container shadow-[2px_2px_0_#231a11]">
          <Icon name="auto_awesome" size="sm" /> 404
        </p>

        <h1 className="mb-3 font-headline-lg text-headline-lg leading-none text-on-surface">
          Recipe not found
        </h1>
        <p className="mx-auto mb-6 max-w-md font-body-md text-on-surface-variant">
          That admin page isn&rsquo;t in the cookbook. It may have been moved, or the link might have a typo.
        </p>

        <div className="mb-8 flex justify-center">
          <PathChip path={pathname} />
        </div>

        {/* Quick links back into the CMS */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-on-surface px-5 py-3 font-label-bold text-label-bold uppercase text-surface-white radical-shadow transition-colors hover:bg-primary"
          >
            <Icon name="dashboard" size="sm" /> Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-5 py-3 font-label-bold text-label-bold uppercase text-on-surface radical-shadow transition-colors hover:bg-surface-container"
          >
            <Icon name="storefront" size="sm" /> Public site
          </Link>
        </div>

        <div className="border-t-2 border-dashed border-outline-variant pt-6">
          <p className="mb-4 font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
            Jump to
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="radical-shadow-sm inline-flex items-center gap-1.5 rounded-full border-2 border-on-surface bg-surface-container-low px-3.5 py-1.5 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-primary-container/25"
                >
                  <Icon name={l.icon} size="sm" /> {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
