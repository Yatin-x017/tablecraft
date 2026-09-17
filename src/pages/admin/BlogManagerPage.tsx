import { useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import type { BlogPost } from "@/lib/content";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type PostDraft = Omit<BlogPost, "id">;

const emptyDraft = (): PostDraft => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  post_type: "blog",
  event_date: null,
  is_published: true,
});

const TYPE_LABEL: Record<BlogPost["post_type"], string> = { blog: "Blog", event: "Event", special: "Special" };

export function BlogManagerPage() {
  const { posts, addPost, updatePost, deletePost } = useAdminStore();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<"all" | BlogPost["post_type"]>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft());

  const filtered = posts.filter((p) => typeFilter === "all" || p.post_type === typeFilter);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setEditingId(id);
    setDraft({ ...post });
    setModalOpen(true);
  };

  const save = () => {
    if (!draft.title.trim()) {
      toast("Title required", { tone: "error", detail: "Give this post a headline." });
      return;
    }
    const slug = draft.slug.trim() || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = { ...draft, slug };
    if (editingId) {
      updatePost(editingId, payload);
      toast("Post updated", { detail: draft.title });
    } else {
      addPost(payload);
      toast("Post created", { detail: draft.title });
    }
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Blog & Events"
        subtitle="Write stories, announce events, and publish the weekend specials."
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        {(["all", "blog", "event", "special"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            aria-pressed={typeFilter === t}
            className={cn(
              "rounded-full border-2 border-on-surface px-4 py-2 font-label-bold text-label-bold uppercase transition-all",
              typeFilter === t ? "bg-on-surface text-surface-white radical-shadow-sm" : "bg-surface-white hover:bg-surface-container"
            )}
          >
            {t === "all" ? "All" : `${TYPE_LABEL[t]}s`}
          </button>
        ))}
        <div className="ml-auto">
          <AdminActionButton icon="add_circle" onClick={openCreate}>New post</AdminActionButton>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((post) => (
          <article key={post.id} className="flex flex-col gap-4 rounded-[24px] radical-border radical-shadow bg-surface-white p-5 transition-transform duration-200 hover:-translate-y-0.5 md:flex-row md:items-center md:gap-6">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl radical-border md:w-44">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt={post.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-container text-on-surface-variant">
                  <Icon name="celebration" size="lg" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={post.post_type === "event" ? "tertiary" : post.post_type === "special" ? "secondary" : "primary"}>
                  {TYPE_LABEL[post.post_type]}
                </Badge>
                {post.event_date && <Badge variant="outline">{formatDate(post.event_date)}</Badge>}
                <Badge variant={post.is_published ? "success" : "outline"}>{post.is_published ? "Published" : "Draft"}</Badge>
              </div>
              <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">{post.title}</h3>
              <p className="mt-1 line-clamp-2 font-body-sm text-on-surface-variant">{post.excerpt}</p>
              <p className="mt-1 font-body-sm text-on-surface-variant/60">/{post.slug}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle
                checked={post.is_published}
                onCheckedChange={(checked) => {
                  updatePost(post.id, { is_published: checked });
                  toast(checked ? "Published" : "Unpublished", { detail: post.title, tone: checked ? "success" : "info" });
                }}
                label={post.is_published ? "Live" : "Draft"}
              />
              <AdminActionButton icon="edit" onClick={() => openEdit(post.id)}>Edit</AdminActionButton>
              <AdminActionButton
                tone="danger"
                icon="delete"
                onClick={() => {
                  deletePost(post.id);
                  toast("Post deleted", { detail: post.title, tone: "info" });
                }}
              >
                Delete
              </AdminActionButton>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-[32px] radical-border radical-shadow bg-surface-white p-16 text-center">
            <Icon name="edit_note" size="xl" className="mx-auto mb-4 text-primary" />
            <p className="font-headline-md text-headline-md text-on-surface">Nothing here yet</p>
            <p className="mt-2 font-body-md text-on-surface-variant">Write your first post to fill this space.</p>
          </div>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Post" : "New Post"}
        subtitle="Blogs tell stories, events sell seats, specials move pastries."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editingId ? "Save Changes" : "Create Post"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. Jazz & Jam: Live Music Night" />
          </div>
          <Input label="Slug (optional)" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} placeholder="auto-generated if empty" icon="link" />
          <div>
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="post-type">Type</label>
            <select
              id="post-type"
              value={draft.post_type}
              onChange={(e) => setDraft((d) => ({ ...d, post_type: e.target.value as BlogPost["post_type"] }))}
              className="h-14 w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 font-body-md focus:border-primary focus:outline-none"
            >
              <option value="blog">Blog</option>
              <option value="event">Event</option>
              <option value="special">Special</option>
            </select>
          </div>
          {draft.post_type === "event" && (
            <Input label="Event date" type="date" value={draft.event_date ?? ""} onChange={(e) => setDraft((d) => ({ ...d, event_date: e.target.value || null }))} icon="event" />
          )}
          <div className="sm:col-span-2">
            <Input label="Excerpt" value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} placeholder="One or two tempting lines…" icon="short_text" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Cover image URL" value={draft.cover_image_url} onChange={(e) => setDraft((d) => ({ ...d, cover_image_url: e.target.value }))} placeholder="https://…" icon="image" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="post-content">Content</label>
            <textarea
              id="post-content"
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              rows={5}
              placeholder="The full story…"
              className="w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 py-3 font-body-md placeholder:text-on-surface-variant/50 focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <Toggle checked={draft.is_published} onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_published: checked }))} label="Publish immediately" />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
