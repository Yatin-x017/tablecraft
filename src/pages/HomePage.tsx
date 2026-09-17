import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { FeaturedMenu } from "@/components/sections/FeaturedMenu";
import { TestimonialsStrip } from "@/components/sections/TestimonialsStrip";
import { fetchMenu, fetchTestimonials } from "@/lib/api";
import { IMG, type MenuItem, type Testimonial } from "@/lib/content";
import { usePageMeta } from "@/lib/seo";

/** Home hero — ported from design/home_crumb_confetti/code.html, with entrance motion. */
function Hero() {
  const reduce = useReducedMotion();
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-container px-margin-mobile py-24 md:px-margin-desktop">
      <div aria-hidden="true" className="absolute left-10 top-10 -rotate-12 text-on-surface opacity-50">
        <Icon name="star" size="xl" />
      </div>
      <div aria-hidden="true" className="absolute bottom-20 right-20 rotate-45 text-on-surface opacity-50">
        <Icon name="auto_awesome" size="lg" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-container-max grid-cols-1 items-center gap-gutter lg:grid-cols-2">
        <div className="order-2 flex flex-col gap-8 lg:order-1">
          <motion.div {...fadeUp(0.05)} className="inline-block w-max -rotate-2 rounded-md border-2 border-surface-white bg-on-surface px-4 py-2 text-surface-white shadow-[2px_2px_0_white]">
            <span className="font-label-bold text-label-bold uppercase">
              <Icon name="campaign" size="sm" className="mr-2 align-middle" />
              Now Baking Fresh Daily
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.15)} className="font-display text-on-surface">
            <span className="block text-[clamp(56px,14vw,80px)] uppercase leading-none md:text-[120px]">Baked</span>
            <span
              className="block text-[clamp(56px,14vw,80px)] uppercase leading-none text-surface-white md:text-[120px]"
              style={{ WebkitTextStroke: "2px #231a11" }}
            >
              With Joy
            </span>
          </motion.h1>
          <motion.div {...fadeUp(0.25)} className="hand-drawn-border relative z-30 mt-8 max-w-xl bg-surface-white p-8 shadow-[8px_8px_0_#231a11]">
            <p className="mb-6 font-body-lg text-body-lg font-semibold text-on-surface">
              Artisanal pastries, craft coffee, and a daily dose of celebration in every crumb. Join us for a
              delightful experience crafted with love and a sprinkle of whimsy.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-md border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-colors hover:bg-primary"
              >
                Book a Table <Icon name="arrow_forward" size="sm" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-md border-2 border-on-surface bg-secondary-container px-6 py-3 font-label-bold text-label-bold uppercase text-on-surface shadow-[4px_4px_0_#231a11] transition-colors hover:bg-surface-container"
              >
                View Menu
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96, rotate: 1 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 3 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 h-[400px] w-full rotate-3 md:h-[600px] lg:order-2"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 rotate-6 scale-105 border-4 border-on-surface bg-surface-white shadow-[12px_12px_0_rgba(255,107,74,0.5)]"
          />
          <img
            className="relative z-10 h-full w-full border-4 border-on-surface object-cover shadow-xl"
            alt="A freshly baked artisanal cherry pie with a golden lattice crust on a rustic wooden table"
            src={IMG.pie}
          />
        </motion.div>
      </div>
    </section>
  );
}

/** Home page: hero + featured menu teaser + testimonials strip (PRD §6.1). */
export function HomePage() {
  usePageMeta(
    "Home",
    "Artisanal pastries, craft coffee, and a daily dose of celebration. Reserve your table at Crumb & Confetti."
  );
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);
  const [tLoading, setTLoading] = useState(true);
  const [tError, setTError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      setMenuItems((await fetchMenu()).items);
    } catch {
      setMenuError("We couldn't load the menu. Please try again.");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const loadTestimonials = useCallback(async () => {
    setTLoading(true);
    setTError(null);
    try {
      setTestimonials(await fetchTestimonials());
    } catch {
      setTError("We couldn't load testimonials. Please try again.");
    } finally {
      setTLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
    void loadTestimonials();
  }, [loadMenu, loadTestimonials]);

  return (
    <>
      <Hero />
      <FeaturedMenu items={menuItems} loading={menuLoading} error={menuError} onRetry={() => void loadMenu()} />
      <TestimonialsStrip
        testimonials={testimonials}
        loading={tLoading}
        error={tError}
        onRetry={() => void loadTestimonials()}
      />
    </>
  );
}
