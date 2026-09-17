import { Link } from "react-router-dom";
import type { MenuItem } from "@/lib/content";
import { MenuCard } from "@/components/content/MenuCard";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, ErrorState } from "@/components/PageStates";
import { Reveal } from "@/components/motion/Reveal";

interface FeaturedMenuProps {
  items: MenuItem[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Home page featured-menu teaser (PRD §6.1 — P0). */
export function FeaturedMenu({ items, loading, error, onRetry }: FeaturedMenuProps) {
  const featured = (items ?? []).filter((i) => i.is_featured && i.is_available).slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-background-cream px-margin-mobile py-24 md:px-margin-desktop">
      <div aria-hidden="true" className="sprinkle-pattern pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-container-max">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-secondary-container px-4 py-1.5 font-label-bold text-label-bold uppercase text-on-secondary-container shadow-[2px_2px_0_#231a11]">
              <Icon name="star" size="sm" /> This week's stars
            </p>
            <h2 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
              Crowd Favorites
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 font-label-bold text-label-bold uppercase text-primary transition-colors hover:text-tertiary"
          >
            View full menu <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Whipping up favorites" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.08} className="h-full">
                <MenuCard item={item} featured />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
