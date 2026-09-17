import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { IMG } from "@/lib/content";
import { usePageMeta } from "@/lib/seo";

const PACKAGES = [
  {
    name: "The Morning Spread",
    price: "$65",
    unit: "per dozen",
    blurb: "Breakfast meetings, showers, and slow Tuesday starts.",
    icon: "bakery_dining",
    features: [
      "Mix & match pastries — croissants, danishes, muffins",
      "House granola with seasonal fruit",
      "Craft coffee service (drip or cold brew)",
      "Platters, napkins & signage included",
      "48-hour advance notice",
    ],
    highlight: false,
  },
  {
    name: "The Party Spread",
    price: "$120",
    unit: "serves 10",
    blurb: "Birthdays, team celebrations, and anything that deserves confetti.",
    icon: "celebration",
    features: [
      "Full pastry case: galettes, tarts, cookies & more",
      "Signature Confetti Latte bar add-on available",
      "Custom cake corner with candles & toppers",
      "Delivery + setup within Brooklyn",
      "72-hour advance notice",
    ],
    highlight: true,
  },
  {
    name: "The Full Fête",
    price: "Custom",
    unit: "quoted per event",
    blurb: "Weddings, big bashes, and the kind of party people talk about.",
    icon: "cake",
    features: [
      "Bespoke multi-tier cake design",
      "Dessert tables with custom styling",
      "Live baking station option",
      "Tasting session with our head baker",
      "Dedicated event coordinator",
    ],
    highlight: false,
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Tell us about the party",
    text: "Fill in the inquiry form or ping us — how many guests, what vibe, any allergies we should dodge. We reply within one business day.",
    icon: "edit_note",
  },
  {
    step: "02",
    title: "Taste & tailor",
    text: "For Full Fête events we host a tasting in the bakehouse. For everything else, we send a menu proposal you can tweak until it's just right.",
    icon: "restaurant_menu",
  },
  {
    step: "03",
    title: "We bake, you celebrate",
    text: "We prep everything fresh the morning of, deliver (or you pick up), and set it up so all you have to do is enjoy the party.",
    icon: "auto_awesome",
  },
];

const FAQS = [
  {
    q: "How far in advance should I book?",
    a: "Two weeks is the sweet spot. Morning Spreads need 48 hours, Party Spreads need 72, and Full Fêtes are best locked in a month ahead — especially on weekends.",
  },
  {
    q: "Do you handle allergies and dietary needs?",
    a: "Absolutely. Gluten-free, vegan, and nut-free options are part of our daily bake, and every catering order includes a full allergen breakdown. Just flag anything specific in your inquiry.",
  },
  {
    q: "Do you deliver?",
    a: "Delivery and setup is included with Party Spreads and Full Fêtes anywhere in Brooklyn. Morning Spreads are available for pickup or delivery for a small fee.",
  },
  {
    q: "Can I order a custom cake through catering?",
    a: "Yes — custom cakes are our favorite thing. Every Full Fête package includes a bespoke cake design, and Party Spreads can add a custom cake corner at checkout.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="overflow-hidden rounded-[20px] radical-border radical-shadow bg-surface-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-container-low"
      >
        <span className="font-headline-md text-headline-md text-on-surface">{q}</span>
        <Icon
          name="expand_more"
          size="sm"
          className={cn("shrink-0 text-primary transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="min-h-0">
          <p className="border-t-2 border-dashed border-outline-variant px-6 py-5 font-body-md text-body-md text-on-surface-variant">{a}</p>
        </div>
      </div>
    </div>
  );
}

/** Catering page — packages, process, and FAQ (replaces the old placeholder). */
export function CateringPage() {
  usePageMeta(
    "Catering — Crumb & Confetti",
    "Catering from Crumb & Confetti: pastry spreads, custom cakes, and full fêtes for every occasion in Brooklyn."
  );

  return (
    <div className="bg-background-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-container px-margin-mobile py-20 md:px-margin-desktop md:py-28">
        <div aria-hidden="true" className="doodle-bg-dots pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="absolute right-8 top-8 rotate-12 text-on-surface opacity-40">
          <Icon name="auto_awesome" size="xl" />
        </div>
        <div className="relative mx-auto max-w-container-max">
          <div className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-2">
            <div>
              <PageHeader
                eyebrow="From our oven to your party"
                title="Catering"
                subtitle="Pastry spreads, custom cakes, and full celebrations — baked fresh the morning of, delivered and set up so you can focus on the fun."
                className="mb-8"
              />
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-all hover:bg-primary"
                >
                  <Icon name="event_seat" size="sm" /> Book a tasting
                </Link>
                <a
                  href="mailto:hello@crumbandconfetti.example?subject=Catering%20inquiry"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-6 py-3 font-label-bold text-label-bold uppercase text-on-surface shadow-[4px_4px_0_#231a11] transition-all hover:bg-surface-container"
                >
                  <Icon name="mail" size="sm" /> Send an inquiry
                </a>
              </div>
            </div>
            <Reveal delay={0.15} className="relative h-[300px] rotate-2 lg:h-[420px]">
              <div aria-hidden="true" className="absolute inset-0 -rotate-2 scale-105 border-4 border-on-surface bg-surface-white shadow-[10px_10px_0_rgba(35,26,17,0.25)]" />
              <img
                src={IMG.cake}
                alt="A three-tier celebration cake covered in confetti and fresh flowers"
                className="relative z-10 h-full w-full border-4 border-on-surface object-cover shadow-xl"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="px-margin-mobile py-20 md:px-margin-desktop md:py-24">
        <div className="mx-auto max-w-container-max">
          <div className="mb-12 text-center">
            <h2 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">Pick your spread</h2>
            <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
              Three starting points — every package is fully customizable. Want something in between? Just ask.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {PACKAGES.map((pkg, i) => (
              <Reveal key={pkg.name} delay={i * 0.08} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-[32px] radical-border radical-shadow bg-surface-white p-8 transition-transform duration-300 hover:-translate-y-2",
                    pkg.highlight && "bg-secondary-container"
                  )}
                >
                  {pkg.highlight && (
                    <span className="absolute -top-3 right-6 rotate-2 rounded-full border-2 border-on-surface bg-on-surface px-4 py-1 font-label-bold text-label-bold uppercase text-surface-white shadow-[2px_2px_0_#231a11]">
                      Most popular
                    </span>
                  )}
                  <span
                    className={cn(
                      "mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-on-surface shadow-[3px_3px_0_#231a11]",
                      pkg.highlight ? "bg-primary-container" : "bg-secondary-container"
                    )}
                  >
                    <Icon name={pkg.icon} size="md" className="text-on-secondary-container" />
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{pkg.name}</h3>
                  <p className="mt-1 font-body-sm text-on-surface-variant">{pkg.blurb}</p>
                  <p className="mt-5">
                    <span className="font-display text-display text-on-surface">{pkg.price}</span>
                    <span className="ml-2 font-label-bold text-label-bold uppercase text-on-surface-variant">{pkg.unit}</span>
                  </p>
                  <ul className="mt-6 flex-grow space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface">
                        <Icon name="check_circle" size="sm" filled className="mt-0.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`mailto:hello@crumbandconfetti.example?subject=${encodeURIComponent(`Catering inquiry — ${pkg.name}`)}`}
                    className={cn(
                      "mt-8 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-on-surface px-6 py-3 font-label-bold text-label-bold uppercase radical-shadow radical-button-press transition-colors",
                      pkg.highlight ? "bg-on-surface text-surface-white hover:bg-primary" : "bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary"
                    )}
                  >
                    Inquire <Icon name="arrow_forward" size="sm" />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="sunset-gradient px-margin-mobile py-20 md:px-margin-desktop md:py-24">
        <div className="mx-auto max-w-container-max">
          <div className="mb-12 text-center">
            <h2 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface/80">
              Three easy steps from inquiry to empty platters.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.08} className="h-full">
                <div className="relative flex h-full flex-col rounded-[20px] border-2 border-on-surface bg-surface-white p-8 shadow-[5px_5px_0_#231a11]">
                  <span className="font-display text-5xl text-primary-container">{p.step}</span>
                  <span className="mt-4 mb-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container">
                    <Icon name={p.icon} size="sm" className="text-on-secondary-container" />
                  </span>
                  <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">{p.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-margin-mobile py-20 md:px-margin-desktop md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">Good questions</h2>
            <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
              The things every host asks us. Anything else — just email.
            </p>
          </div>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.05}>
                <FaqItem q={f.q} a={f.a} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-margin-mobile pb-20 md:px-margin-desktop md:pb-24">
        <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-6 rounded-[32px] radical-border radical-shadow bg-on-surface px-8 py-10 text-center text-surface-white md:flex-row md:text-left">
          <div>
            <h2 className="font-headline-md text-headline-md">Got a party on the horizon?</h2>
            <p className="mt-1 font-body-md text-surface-white/70">
              Let's make it delicious — tell us what you're dreaming up.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#ff6586] transition-all hover:bg-primary hover:text-on-primary"
            >
              <Icon name="event_seat" size="sm" /> Book a table
            </Link>
            <a
              href="tel:+15550102026"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-6 py-3 font-label-bold text-label-bold uppercase text-on-surface transition-colors hover:bg-surface-container"
            >
              <Icon name="call" size="sm" /> (555) 010-2026
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
