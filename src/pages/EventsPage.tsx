import { useEffect, useMemo, useState } from "react";
import { fetchBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/lib/content";
import { cn } from "@/lib/utils";
import { PageHeader, LoadingState, ErrorState } from "@/components/PageStates";
import { BlogCard } from "@/components/content/BlogCard";
import { Reveal } from "@/components/motion/Reveal";
import { EventBookingModal } from "@/components/booking/EventBookingModal";
import { usePageMeta } from "@/lib/seo";

type Filter = "all" | BlogPost["post_type"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "event", label: "Events" },
  { value: "special", label: "Specials" },
  { value: "blog", label: "Stories" },
];

/** Blog / Events / Specials listing (PRD §6.1 — P0, Phase 1). */
export function EventsPage() {
  usePageMeta("News & Events", "Live music nights, weekend specials, and the stories behind the sprinkles at Crumb & Confetti.");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingPost, setBookingPost] = useState<BlogPost | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBlogPosts();
      setPosts(data);
    } catch {
      setError("We couldn't load our latest news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => (filter === "all" ? posts : posts.filter((p) => p.post_type === filter)), [posts, filter]);

  return (
    <div className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div className="mx-auto max-w-container-max">
        <PageHeader
          eyebrow="Fresh off the oven tray"
          title="News & Events"
          subtitle="Live music nights, weekend specials, and the stories behind the sprinkles."
        />

        <div className="mb-12 flex flex-wrap gap-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border-2 border-on-surface px-6 py-2.5 font-label-bold text-label-bold uppercase transition-all",
                filter === f.value
                  ? "bg-secondary-container text-on-secondary-container shadow-[3px_3px_0_#231a11]"
                  : "bg-surface-white text-on-surface shadow-[2px_2px_0_#231a11] hover:bg-primary-container/15"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState label="Reading the oven timer" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : visible.length === 0 ? (
          <p className="font-body-lg text-on-surface-variant">Nothing here yet — check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, i) => (
              <Reveal key={post.id} delay={Math.min(i % 3, 2) * 0.08} className="h-full">
                <BlogCard post={post} onReserve={setBookingPost} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* RSVP modal — mounted while a post exists so exit animations play */}
      {(bookingPost ?? visible[0]) && (
        <EventBookingModal
          post={bookingPost ?? visible[0]!}
          open={bookingPost !== null}
          onClose={() => setBookingPost(null)}
        />
      )}
    </div>
  );
}
