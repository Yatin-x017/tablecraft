import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/lib/content";
import { LoadingState, ErrorState } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { EventBookingModal } from "@/components/booking/EventBookingModal";
import { usePageMeta } from "@/lib/seo";

const TYPE_LABEL: Record<BlogPost["post_type"], string> = {
  blog: "Story",
  event: "Event",
  special: "Special",
};

/** Blog / event / special detail page (Phase 1). */
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  usePageMeta(post?.title ?? "Story", post?.excerpt ?? undefined);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await fetchBlogPosts();
        setPost(posts.find((p) => p.slug === slug) ?? null);
      } catch {
        setError("We couldn't load this story. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop">
        <LoadingState label="Turning the page" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop">
        <ErrorState message={error ?? "This story doesn't exist (yet)."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const date = post.event_date
    ? new Date(post.event_date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/events"
          className="mb-8 inline-flex items-center gap-2 font-label-bold text-label-bold uppercase text-primary transition-colors hover:text-tertiary"
        >
          <Icon name="arrow_back" size="sm" /> All news
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={post.post_type === "event" ? "tertiary" : post.post_type === "special" ? "secondary" : "primary"}>
            {TYPE_LABEL[post.post_type]}
          </Badge>
          {date && (
            <Badge variant="outline">
              <Icon name="calendar_month" size="sm" /> {date}
            </Badge>
          )}
        </div>
        <h1 className="mb-8 font-headline-lg text-headline-lg uppercase leading-tight text-on-surface">{post.title}</h1>
        <div className="mb-10 overflow-hidden rounded-[20px] border-4 border-on-surface shadow-[8px_8px_0_rgba(255,107,74,0.5)]">
          <img src={post.cover_image_url} alt={post.title} className="max-h-[480px] w-full object-cover" />
        </div>
        <div className="space-y-6">
          <p className="font-body-lg text-body-lg font-medium text-on-surface">{post.excerpt}</p>
          {post.content.split("\n\n").map((para, i) => (
            <p key={i} className="font-body-md text-body-md text-on-surface-variant">
              {para}
            </p>
          ))}
        </div>
        {/* Event posts get an RSVP CTA; others get the table-booking nudge */}
        {post.post_type === "event" ? (
          <div className="mt-12 rounded-[20px] border-2 border-on-surface bg-tertiary-container p-8 text-center shadow-[4px_4px_0_#231a11]">
            <p className="mb-2 font-label-bold text-label-bold uppercase tracking-widest text-on-tertiary-container">
              Limited spots available
            </p>
            <p className="mb-4 font-headline-md text-headline-md text-on-surface">
              {post.event_date
                ? `Join us ${new Date(post.event_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
                : "Join the celebration!"}
            </p>
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-all hover:bg-primary hover:shadow-[2px_2px_0_#ff6586]"
            >
              <Icon name="event_seat" size="sm" /> Reserve a Spot
            </button>
          </div>
        ) : (
          <div className="mt-12 rounded-[20px] border-2 border-on-surface bg-primary-container p-8 text-center shadow-[4px_4px_0_#231a11]">
            <p className="mb-4 font-headline-md text-headline-md text-on-surface">Fancy a visit?</p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-on-surface px-6 py-3 font-label-bold text-label-bold uppercase text-surface-white shadow-[4px_4px_0_#ff6586] transition-all hover:bg-primary"
            >
              Book a table <Icon name="arrow_forward" size="sm" />
            </Link>
          </div>
        )}
      </div>

      {/* RSVP modal */}
      {post && (
        <EventBookingModal post={post} open={bookingOpen} onClose={() => setBookingOpen(false)} />
      )}
    </article>
  );
}
