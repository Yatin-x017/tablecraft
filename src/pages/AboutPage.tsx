import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { IMG } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { usePageMeta } from "@/lib/seo";

const VALUES = [
  {
    icon: "bakery_dining",
    title: "Baked Daily",
    text: "Every croissant, galette, and loaf starts before sunrise and sells out most days. If it's in the case, it's fresh.",
  },
  {
    icon: "celebration",
    title: "Celebration First",
    text: "We believe even a Tuesday coffee deserves confetti. Every order is treated like a tiny party.",
  },
  {
    icon: "eco",
    title: "Local & Honest",
    text: "Market fruit, local dairy, compostable packaging, and a starter that's older than most of our staff.",
  },
];

/** About / story page (PRD §6.1 — P0, Phase 1). */
export function AboutPage() {
  usePageMeta("Our Story", "A bakery with a party heart — the Crumb & Confetti story, baked daily in Brooklyn.");
  return (
    <div className="bg-background-cream">
      <section className="relative overflow-hidden bg-primary-container px-margin-mobile py-24 md:px-margin-desktop">
        <div aria-hidden="true" className="absolute right-10 top-10 rotate-45 text-on-surface opacity-40">
          <Icon name="auto_awesome" size="xl" />
        </div>
        <div className="relative mx-auto grid max-w-container-max grid-cols-1 items-center gap-gutter lg:grid-cols-2">
          <div>
            <PageHeader eyebrow="Our story" title="A Bakery with a Party Heart" className="mb-0" />
            <div className="mt-6 space-y-4 font-body-lg text-body-lg text-on-surface">
              <p>
                Crumb &amp; Confetti started with one stubborn belief: that a neighborhood bakery should feel like a
                celebration, not a museum. We opened our doors with a secondhand oven, a 40-year-old sourdough starter
                named Gerald, and far too much confetti.
              </p>
              <p>
                Today we're still the same — just with better lighting. Pastries laminated by hand each morning, coffee
                roasted for our bar exactly how we like it, and custom cakes that show up to parties ready to steal the
                show.
              </p>
            </div>
            <Link
              to="/book"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-all hover:bg-primary"
            >
              Book a table <Icon name="arrow_forward" size="sm" />
            </Link>
          </div>
          <Reveal delay={0.15} className="relative h-[400px] rotate-2 lg:h-[480px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 -rotate-2 scale-105 border-4 border-on-surface bg-surface-white shadow-[10px_10px_0_rgba(255,107,74,0.5)]"
            />
            <img
              src={IMG.interior}
              alt="The warm, playful interior of Crumb and Confetti bakery"
              className="relative z-10 h-full w-full border-4 border-on-surface object-cover shadow-xl"
            />
          </Reveal>
        </div>
      </section>

      <section className="px-margin-mobile py-24 md:px-margin-desktop">
        <div className="mx-auto max-w-container-max">
          <h2 className="mb-12 text-center font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
            What We're About
          </h2>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className="h-full">
              <div
                key={v.title}
                className="rounded-[20px] border-2 border-on-surface bg-surface-white p-8 text-center shadow-[5px_5px_0_#231a11] transition-transform duration-300 hover:-translate-y-1.5"
              >
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container shadow-[3px_3px_0_#231a11]">
                  <Icon name={v.icon} size="md" className="text-on-secondary-container" />
                </span>
                <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">{v.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{v.text}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
