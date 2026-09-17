import { useEffect, useState } from "react";
import { fetchBusinessHours, fetchSiteSettings } from "@/lib/api";
import type { BusinessHours, SiteSettings } from "@/lib/content";
import { PageHeader, LoadingState, ErrorState } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { DAY_NAMES, DAY_SHORT, formatTime, formatTimeShort } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { usePageMeta } from "@/lib/seo";

/** Contact page — map embed, hours, social links (PRD §6.1 — P0, Phase 1). */
export function ContactPage() {
  usePageMeta("Contact & Hours", "Find Crumb & Confetti on Sprinkle Street, Brooklyn — hours, map, and social links.");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([fetchSiteSettings(), fetchBusinessHours()]);
      setSettings(s);
      setHours(h);
    } catch {
      setError("We couldn't load our contact details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const socials = settings?.social_links ?? {};
  const socialList = [
    { key: "instagram", label: "Instagram", icon: "photo_camera", href: socials.instagram },
    { key: "facebook", label: "Facebook", icon: "thumb_up", href: socials.facebook },
    { key: "tiktok", label: "TikTok", icon: "music_note", href: socials.tiktok },
  ].filter((s) => s.href);

  return (
    <div className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div className="mx-auto max-w-container-max">
        <PageHeader
          eyebrow="Say hello"
          title="Contact & Hours"
          subtitle="Come find us on Sprinkle Street, or reach out for custom cakes and catering."
        />

        {loading ? (
          <LoadingState label="Finding our address" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
            {/* Info + hours */}
            <Reveal className="flex flex-col gap-gutter">
              <div className="rounded-[20px] border-2 border-on-surface bg-surface-white p-8 shadow-[4px_4px_0_#231a11]">
                <h2 className="mb-6 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                  <Icon name="storefront" className="text-primary" /> Visit us
                </h2>
                <ul className="space-y-4 font-body-md text-body-md">
                  <li className="flex items-start gap-3">
                    <Icon name="location_on" size="sm" className="mt-0.5 text-primary" />
                    <span>
                      {settings?.address}, {settings?.city}, {settings?.country}
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="call" size="sm" className="text-primary" />
                    <a href={`tel:${settings?.phone}`} className="underline-offset-2 hover:underline">
                      {settings?.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Icon name="mail" size="sm" className="text-primary" />
                    <a href={`mailto:${settings?.email}`} className="underline-offset-2 hover:underline">
                      {settings?.email}
                    </a>
                  </li>
                </ul>
                {socialList.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t-2 border-dashed border-outline-variant pt-6">
                    {socialList.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-primary-container/15 px-4 py-2 font-label-bold text-label-bold uppercase transition-colors hover:bg-primary-container"
                      >
                        <Icon name={s.icon} size="sm" /> {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[20px] border-2 border-on-surface bg-surface-white p-8 shadow-[4px_4px_0_#231a11]">
                <h2 className="mb-6 flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                  <Icon name="schedule" className="text-primary" /> Opening hours
                </h2>
                <ul className="divide-y-2 divide-outline-variant/40">
                  {hours.map((h) => (
                    <li key={h.day_of_week} className="flex items-center justify-between py-3">
                      <span className="font-label-bold text-label-bold uppercase text-on-surface">
                        {DAY_NAMES[h.day_of_week]}
                      </span>
                      <span className="font-body-md text-on-surface-variant">
                        {h.is_closed ? (
                          <span className="font-label-bold text-error-red">Closed</span>
                        ) : (
                          <>
                            {formatTime(h.open_time)} – {formatTime(h.close_time)}
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Map embed */}
            <Reveal delay={0.15} className="overflow-hidden rounded-[20px] border-2 border-on-surface bg-surface-white shadow-[4px_4px_0_#231a11]">
              <div className="flex items-center gap-2 border-b-2 border-on-surface bg-surface-container px-6 py-4">
                <Icon name="map" className="text-primary" />
                <span className="font-label-bold text-label-bold uppercase text-on-surface">
                  {settings?.city ?? "Find us on the map"}
                </span>
              </div>
              <iframe
                title="Map to Crumb & Confetti"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3025.5!2d-73.99!3d40.68!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQwJzQ4LjAiTiA3M8KwNTknMjQuMCJX!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                className="h-[420px] w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-wrap gap-2 border-t-2 border-on-surface bg-surface-container-low px-6 py-4">
                {hours.map((h) => (
                  <span
                    key={h.day_of_week}
                    className="rounded-full border-2 border-on-surface bg-surface-white px-3 py-1 font-label-bold text-[11px] uppercase text-on-surface-variant"
                  >
                    {DAY_SHORT[h.day_of_week]} {h.is_closed ? "✕" : `${formatTimeShort(h.open_time)}–${formatTimeShort(h.close_time)}`}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
