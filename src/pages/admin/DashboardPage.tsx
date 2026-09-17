import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";
import { StatCard, SparkRow, AdminSection, AdminActionButton } from "@/components/admin/AdminUI";
import { MobileReservationCard, RESERVATION_STATUS_STYLES as STATUS_STYLES, AVATAR_BGS } from "@/components/admin/ReservationCard";
import { PageHeader } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { formatSlotTime } from "@/lib/booking";
import { initials } from "@/lib/format";
import { usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  usePageMeta("Dashboard", "Today's reservations, analytics, and crowd favorites at a glance.");
  const { reservations, items, hours } = useAdminStore();
  const [timeRange, setTimeRange] = useState("Today");

  // Derived analytics (demo): total/upcoming reservations, avg party.
  const totalReservations = reservations.length;
  const upcoming = reservations.filter((r) => r.status === "confirmed" || r.status === "arrived").length;
  const avgParty = reservations.length
    ? (reservations.reduce((sum, r) => sum + r.partySize, 0) / reservations.length).toFixed(1)
    : "0.0";
  const soldOutCount = items.filter((i) => !i.is_available).length;

  // Busiest-times histogram from reservation start hours, shaped by the selected range.
  const hourBuckets = useMemo(() => {
    const buckets = new Array(12).fill(0); // 8 AM .. 7 PM
    for (const r of reservations) {
      const h = new Date(r.startTime).getHours();
      if (h >= 8 && h < 20) buckets[h - 8] += 1;
    }
    // Demo: nudge the curve per range so the selector visibly drives the chart.
    const profiles: Record<string, number[]> = {
      Today: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      Yesterday: [0.7, 0.8, 0.9, 1.1, 1.2, 1.15, 1.05, 0.95, 0.9, 0.85, 0.8, 0.7],
      "Weekly Avg.": [0.6, 0.7, 0.8, 0.9, 1.0, 1.05, 1.1, 1.15, 1.1, 1.05, 0.95, 0.85],
    };
    const profile = profiles[timeRange] ?? profiles.Today;
    const scaled = buckets.map((n, i) => n * profile[i]);
    const max = Math.max(...scaled, 1);
    return scaled.map((n) => Math.round((n / max) * 100));
  }, [reservations, timeRange]);

  const hourLabels = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM"];

  // Top treats — derived from featured/available items with demo sold counts.
  const topTreats = useMemo(() => {
    const featured = items.filter((i) => i.is_featured || i.is_available).slice(0, 4);
    const counts = [142, 118, 95, 84];
    return featured.map((item, i) => ({
      item,
      sold: counts[i] ?? 60,
      emoji: ["🥐", "🍰", "🧁", "☕"][i] ?? "🍩",
    }));
  }, [items]);

  const maxSold = Math.max(...topTreats.map((t) => t.sold), 1);

  const sortedReservations = useMemo(
    () => [...reservations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 6),
    [reservations]
  );

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Here's what's baking today, Chef!"
        subtitle="Reservations, revenue and crowd favorites at a glance."
      />

      {/* Quick actions */}
      <div className="mb-12 flex flex-wrap gap-3">
        <Link
          to="/admin/reservations"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-6 py-3 font-label-bold text-label-bold uppercase radical-shadow transition-transform hover:-translate-y-1"
        >
          <Icon name="add_circle" size="sm" /> Manual booking
        </Link>
        <Link
          to="/admin/menu"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-secondary-container px-6 py-3 font-label-bold text-label-bold uppercase radical-shadow transition-transform hover:-translate-y-1"
        >
          <Icon name="edit_note" size="sm" /> Edit menu
        </Link>
        <Link
          to="/admin/floor"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-tertiary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-tertiary-container radical-shadow transition-transform hover:-translate-y-1"
        >
          <Icon name="table_restaurant" size="sm" /> Floor setup
        </Link>
      </div>

      {/* Analytics bento */}
      <div className="mb-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard
          label="Reservations Today"
          value={String(totalReservations)}
          delta="+12%"
          deltaTone="up"
          icon="event_seat"
          iconBg="bg-primary-fixed"
          iconColor="text-primary"
          bars={[40, 60, 55, 80, 95, 65, 100]}
          barColor="bg-primary-container"
        />
        <StatCard
          label="Avg Party Size"
          value={avgParty}
          delta="+8.4%"
          deltaTone="up"
          icon="groups"
          iconBg="bg-secondary-fixed"
          iconColor="text-secondary"
          bars={[50, 40, 70, 60, 85, 90, 75]}
          barColor="bg-secondary-container"
        />
        <StatCard
          label="Upcoming Seats"
          value={String(upcoming)}
          delta={`${soldOutCount} sold out`}
          deltaTone={soldOutCount > 2 ? "down" : "up"}
          icon="person_add"
          iconBg="bg-tertiary-fixed"
          iconColor="text-tertiary"
          bars={[70, 85, 60, 50, 40, 30, 45]}
          barColor="bg-tertiary-container"
        />
      </div>

      {/* Busiest times + top treats */}
      <div className="mb-12 grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-[32px] radical-border bg-surface-white p-8 radical-shadow lg:col-span-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Busiest Times</h3>
              <p className="font-body-sm text-on-surface-variant">Optimal staffing based on visitor traffic</p>
            </div>
            <label className="sr-only" htmlFor="time-range">Time range</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg border-2 border-on-surface bg-background-cream px-4 py-2 font-label-bold text-label-bold uppercase focus:border-primary focus:outline-none"
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>Weekly Avg.</option>
            </select>
          </div>
          <div className="chart-grid relative h-[250px] w-full border-2 border-outline-variant p-4" role="img" aria-label="Reservations by hour">
            <div className="absolute inset-0 flex items-end justify-around px-6">
              {hourBuckets.map((h, i) => {
                const peak = h >= 80;
                return (
                  <div key={hourLabels[i]} className="group flex h-full w-full flex-col items-center justify-end gap-2">
                    <div
                      className={cn(
                        "w-8 rounded-t-md transition-all duration-300 md:w-12",
                        peak ? "bg-tertiary-container ring-4 ring-tertiary-fixed group-hover:bg-tertiary" : "bg-primary-container group-hover:bg-primary"
                      )}
                      style={{ height: `${Math.max(h, 6)}%` }}
                    />
                    <span className={cn("text-[10px] font-label-bold", peak ? "text-tertiary" : "text-on-surface-variant")}>
                      {hourLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] radical-border bg-surface-white p-8 radical-shadow lg:col-span-4">
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">Top Treats</h3>
          <p className="mb-6 font-body-sm text-on-surface-variant">Crowd favorites this week</p>
          <div className="space-y-6">
            {topTreats.map(({ item, sold, emoji }, i) => (
              <SparkRow
                key={item.id}
                label={item.name}
                value={String(sold)}
                emoji={emoji}
                pct={Math.round((sold / maxSold) * 100)}
                barClass={["bg-secondary-container", "bg-tertiary-container", "bg-primary-container", "bg-on-surface-variant"][i % 4]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live reservation feed */}
      <AdminSection
        title="Live Reservation Feed"
        subtitle="Manage today's floor traffic in real-time"
        actions={
          <>
            <AdminActionButton icon="filter_list" onClick={() => {}}>Filter</AdminActionButton>
            <AdminActionButton icon="sync" onClick={() => {}}>Refresh</AdminActionButton>
          </>
        }
      >
        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {sortedReservations.map((r, i) => (
            <MobileReservationCard
              key={r.id}
              reservation={r}
              index={i}
              footer={
                <Link
                  to="/admin/reservations"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-on-surface bg-surface-container px-4 py-2.5 font-label-bold text-label-bold uppercase text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  View <Icon name="arrow_forward" size="sm" />
                </Link>
              }
            />
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-high">
              <tr>
                {["Guest Name", "Party", "Time", "Status", "Actions"].map((h) => (
                  <th key={h} className="border-b-2 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant md:px-8">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-surface-container">
              {sortedReservations.map((r, i) => {
                const style = STATUS_STYLES[r.status];
                return (
                  <tr key={r.id} className="group transition-colors hover:bg-background-cream">
                    <td className="px-6 py-6 md:px-8">
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-on-surface font-bold", AVATAR_BGS[i % AVATAR_BGS.length])}>
                          {initials(r.guestName)}
                        </span>
                        <div>
                          <div className="font-label-bold text-on-surface">{r.guestName}</div>
                          <div className="text-body-sm opacity-60">{r.note ?? r.confirmationCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-body-md md:px-8">{r.partySize} People</td>
                    <td className="px-6 py-6 font-body-md font-bold text-primary md:px-8">{formatSlotTime(r.startTime)}</td>
                    <td className="px-6 py-6 md:px-8">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border-2 border-on-surface px-3 py-1 text-xs font-label-bold", style.className)}>
                        <Icon name={style.icon} size="sm" /> {style.label}
                      </span>
                    </td>
                    <td className="px-6 py-6 md:px-8">
                      <Link to="/admin/reservations" className="font-label-bold text-primary underline-offset-4 transition-colors hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center bg-surface-container-low p-4">
          <Link to="/admin/reservations" className="font-label-bold text-primary transition-all hover:underline">
            View all reservations
          </Link>
        </div>
      </AdminSection>

      {/* Kitchen status footer strip */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[20px] radical-border bg-on-surface px-6 py-5 text-surface-white">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-mint opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success-mint" />
          </span>
          <span className="font-label-bold text-label-bold uppercase">Kitchen is LIVE</span>
        </div>
        <p className="font-body-sm opacity-80">
          {hours.filter((h) => !h.is_closed).length} open days this week · {items.length} menu items · {soldOutCount} sold out today
        </p>
      </div>
    </div>
  );
}
