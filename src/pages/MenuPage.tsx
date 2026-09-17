import { useEffect, useMemo, useState } from "react";
import { fetchMenu } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { PageHeader, LoadingState, ErrorState } from "@/components/PageStates";
import { MenuCard } from "@/components/content/MenuCard";
import { Reveal } from "@/components/motion/Reveal";
import { usePageMeta } from "@/lib/seo";

/** Public menu page — category tabs + item cards (PRD §6.1, Phase 1). */
export function MenuPage() {
  usePageMeta("Our Menu", "Browse the Crumb & Confetti menu — pastries, coffee, and custom cakes, with dietary tags on every item.");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenu();
      setCategories(data.categories.filter((c) => c.is_active));
      setItems(data.items.filter((i) => i.is_available));
    } catch {
      setError("We couldn't fetch the menu. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleItems = useMemo(() => {
    if (activeSlug === "all") return items;
    const category = categories.find((c) => c.slug === activeSlug);
    return items.filter((i) => i.category_id === category?.id);
  }, [items, categories, activeSlug]);

  return (
    <div className="relative overflow-hidden bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div aria-hidden="true" className="doodle-bg-dots pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-container-max">
        <PageHeader
          eyebrow="Fresh daily"
          title="Our Menu"
          subtitle="Everything baked, brewed, and sprinkled in-house. Dietary tags on every card — just ask for today's gluten-free and vegan picks at the counter."
        />

        {/* Category filter buttons */}
        <div className="mb-12 flex flex-wrap gap-3">
          {[{ id: "all", name: "All Items", slug: "all" }, ...categories].map((cat) => {
            const active = activeSlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveSlug(cat.slug)}
                className={cn(
                  "rounded-[16px] border-2 border-on-surface px-6 py-3 font-label-bold text-label-bold uppercase transition-all",
                  active
                    ? "bg-secondary-container text-on-secondary-container shadow-[3px_3px_0_#231a11]"
                    : "bg-surface-white text-on-surface shadow-[2px_2px_0_#231a11] hover:bg-primary-container/15"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <LoadingState label="Firing up the ovens" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <>
            {visibleItems.length === 0 ? (
              <p className="font-body-lg text-on-surface-variant">
                Nothing listed here right now — check back after the morning bake.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleItems.map((item, i) => (
                  <Reveal key={item.id} delay={Math.min(i % 4, 3) * 0.06} className="h-full">
                    <MenuCard item={item} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
