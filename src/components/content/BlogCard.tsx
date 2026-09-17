import { Link } from "react-router-dom";
import type { BlogPost } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";

const POST_TYPE_LABELS: Record<BlogPost["post_type"], string> = {
  blog: "Story",
  event: "Event",
  special: "Special",
};

interface BlogCardProps {
  post: BlogPost;
  /** When provided, event posts render a "Reserve a Spot" CTA instead of Read more. */
  onReserve?: (post: BlogPost) => void;
}

/** Blog/event/special card with type badge and optional event date. */
export function BlogCard({ post, onReserve }: BlogCardProps) {
  const badgeVariant: "primary" | "secondary" | "tertiary" =
    post.post_type === "event" ? "tertiary" : post.post_type === "special" ? "secondary" : "primary";
  const isEvent = post.post_type === "event";
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border-2 border-on-surface bg-surface-white shadow-[4px_4px_0_#231a11] transition-transform duration-300 hover:-translate-y-1.5">
    <Link
      to={`/events/${post.slug}`}
      className="flex h-full flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-on-surface">
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge variant={badgeVariant}>{POST_TYPE_LABELS[post.post_type]}</Badge>
          {post.event_date && (
            <Badge variant="outline">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">
                calendar_month
              </span>
              {formatDate(post.event_date)}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-grow flex-col p-6">
        <h3
          className={cn(
            "mb-3 font-headline-md text-headline-md leading-snug text-on-surface",
            "transition-colors group-hover:text-primary"
          )}
        >
          {post.title}
        </h3>
        <p className="mb-6 flex-grow font-body-sm text-body-sm text-on-surface-variant">{post.excerpt}</p>
        <span className="inline-flex items-center gap-1 font-label-bold text-label-bold uppercase text-primary">
          Read more
          <span aria-hidden="true" className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </span>
      </div>
    </Link>
    {/* Reserve CTA — rendered outside the Link so it can be a button */}
    {isEvent && onReserve && (
      <div className="border-t-2 border-dashed border-outline-variant px-6 py-4">
        <button
          type="button"
          onClick={() => onReserve(post)}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-on-surface bg-tertiary-container px-5 py-3 font-label-bold text-label-bold uppercase text-on-tertiary-container shadow-[3px_3px_0_#231a11] transition-all hover:scale-[1.02] hover:bg-tertiary hover:text-on-tertiary active:translate-y-0.5 active:shadow-none"
        >
          <Icon name="event_seat" size="sm" /> Reserve a Spot
        </button>
      </div>
    )}
    </div>
  );
}
