import { Link } from "react-router-dom";
import type { MenuItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const DIETARY_LABELS: Record<string, string> = {
  vegan: "Vegan",
  "gluten-free": "Gluten-Free",
  "nut-free": "Nut-Free",
  vegetarian: "Veggie",
};

/** Menu item card — ported from the Menu Manager mockup card design. */
export function MenuCard({ item, featured }: { item: MenuItem; featured?: boolean }) {
  const soldOut = !item.is_available;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[20px] border-2 border-on-surface bg-surface-white p-4 shadow-[4px_4px_0_#231a11]",
        "transition-transform duration-300 hover:-translate-y-1.5",
        soldOut && "opacity-90"
      )}
    >
      {item.is_featured && !soldOut && (
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border-2 border-on-surface bg-secondary-container px-3 py-1 text-label-bold text-xs uppercase text-on-secondary-container shadow-[2px_2px_0_#231a11]">
          <Icon name="star" size="sm" /> Featured
        </span>
      )}
      {soldOut && (
        <span className="absolute left-4 top-4 z-10 rounded-full border-2 border-on-surface bg-error-red px-3 py-1 text-label-bold text-xs uppercase text-white shadow-[2px_2px_0_#231a11]">
          Daily Batch Done
        </span>
      )}
      <div className="mb-4 aspect-square overflow-hidden rounded-[16px] border-2 border-on-surface">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
            soldOut && "opacity-60 grayscale"
          )}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">{item.name}</h3>
        <span className="shrink-0 font-headline-md text-headline-md text-primary">
          ${item.price.toFixed(2)}
        </span>
      </div>
      <p className="mb-4 mt-2 flex-grow font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
      <div className="flex flex-wrap gap-1.5 border-t-2 border-dashed border-outline-variant pt-3">
        {item.dietary_tags.length > 0 ? (
          item.dietary_tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border-2 border-on-surface bg-primary-container/15 px-2.5 py-0.5 text-label-bold text-[11px] uppercase text-on-surface-variant"
            >
              {DIETARY_LABELS[tag] ?? tag}
            </span>
          ))
        ) : (
          <span className="font-body-sm text-[12px] italic text-on-surface-variant/60">Fresh daily</span>
        )}
      </div>
      {featured && (
        <Link
          to="/book"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-on-surface bg-primary-container px-4 py-2.5 font-label-bold text-label-bold uppercase text-on-primary-container shadow-[3px_3px_0_#231a11] transition-all hover:bg-primary hover:text-on-primary"
        >
          Reserve a Tasting <Icon name="arrow_forward" size="sm" />
        </Link>
      )}
    </article>
  );
}
