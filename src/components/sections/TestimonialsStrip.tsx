import type { Testimonial } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/PageStates";
import { initials } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size="sm"
          filled={i < rating}
          className={i < rating ? "text-secondary" : "text-outline"}
        />
      ))}
    </div>
  );
}

interface TestimonialsStripProps {
  testimonials: Testimonial[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Home page testimonials strip (PRD §6.1 — P0). */
export function TestimonialsStrip({ testimonials, loading, error, onRetry }: TestimonialsStripProps) {
  const list = (testimonials ?? []).slice(0, 3);

  return (
    <section className="relative bg-primary-container px-margin-mobile py-24 md:px-margin-desktop">
      <div aria-hidden="true" className="absolute left-8 top-8 -rotate-12 text-on-surface opacity-40">
        <Icon name="auto_awesome" size="lg" />
      </div>
      <div className="relative mx-auto max-w-container-max">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-on-surface px-4 py-1.5 font-label-bold text-label-bold uppercase text-surface-white shadow-[2px_2px_0_white]">
          <Icon name="favorite" size="sm" /> Sweet words
        </p>
        <h2 className="mb-12 font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
          Loved by Regulars
        </h2>

        {loading ? (
          <LoadingState label="Gathering praise" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {list.map((t, i) => (
              <Reveal key={t.id} as="figure" delay={i * 0.08} className="h-full">
                <figure
                key={t.id}
                className="flex flex-col gap-4 rounded-[20px] border-2 border-on-surface bg-surface-white p-6 shadow-[5px_5px_0_#231a11]"
              >
                <Stars rating={t.rating} />
                <blockquote className="flex-grow font-body-lg text-body-lg text-on-surface">“{t.quote}”</blockquote>
                <figcaption className="flex items-center gap-3 border-t-2 border-dashed border-outline-variant pt-4">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-container font-label-bold text-label-bold text-on-secondary-container"
                  >
                    {initials(t.customer_name)}
                  </span>
                  <span className="font-label-bold text-label-bold uppercase text-on-surface">
                    {t.customer_name}
                  </span>
                </figcaption>
              </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
