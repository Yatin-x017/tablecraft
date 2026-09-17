import { useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function GalleryManagerPage() {
  const { gallery, addGalleryImage, updateGalleryImage, deleteGalleryImage, moveGalleryImage } = useAdminStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setUrl("");
    setAlt("");
    setCaption("");
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const img = gallery.find((g) => g.id === id);
    if (!img) return;
    setEditingId(id);
    setUrl(img.image_url);
    setAlt(img.alt_text);
    setCaption(img.caption);
    setModalOpen(true);
  };

  const save = () => {
    if (!url.trim()) {
      toast("Image URL required", { tone: "error", detail: "Paste a link to the photo." });
      return;
    }
    if (!alt.trim()) {
      toast("Alt text required", { tone: "error", detail: "Describe the photo for accessibility." });
      return;
    }
    if (editingId) {
      updateGalleryImage(editingId, { image_url: url, alt_text: alt, caption });
      toast("Image updated", { detail: alt });
    } else {
      addGalleryImage({ image_url: url, alt_text: alt, caption, display_order: gallery.length + 1, is_active: true });
      toast("Photo added", { detail: alt });
    }
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Gallery Manager"
        subtitle="Upload, reorder, and caption the moments that make the bakehouse sparkle."
      />

      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <AdminActionButton icon="add_photo_alternate" onClick={openCreate}>Add photo</AdminActionButton>
      </div>

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((img, i) => (
          <article key={img.id} className="group overflow-hidden rounded-[32px] radical-border radical-shadow bg-surface-white transition-transform duration-300 hover:-translate-y-1.5">
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-on-surface">
              <img src={img.image_url} alt={img.alt_text} loading="lazy" className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", !img.is_active && "opacity-50 grayscale")} />
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded-full border-2 border-on-surface bg-surface-white px-3 py-1 text-xs font-label-bold uppercase radical-shadow-sm">
                  #{i + 1}
                </span>
                {!img.is_active && (
                  <span className="rounded-full border-2 border-on-surface bg-error-red px-3 py-1 text-xs font-label-bold uppercase text-white radical-shadow-sm">
                    Hidden
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <h3 className="mb-1 font-headline-md text-headline-md leading-tight text-on-surface">{img.caption || "Untitled"}</h3>
              <p className="mb-4 line-clamp-2 font-body-sm text-on-surface-variant">{img.alt_text}</p>
              <div className="flex flex-wrap items-center gap-2">
                <AdminActionButton icon="edit" onClick={() => openEdit(img.id)}>Edit</AdminActionButton>
                <AdminActionButton icon="arrow_upward" ariaLabel="Move up" onClick={() => moveGalleryImage(img.id, -1)} />
                <AdminActionButton icon="arrow_downward" ariaLabel="Move down" onClick={() => moveGalleryImage(img.id, 1)} />
                <button
                  type="button"
                  onClick={() => {
                    updateGalleryImage(img.id, { is_active: !img.is_active });
                    toast(img.is_active ? "Photo hidden" : "Photo visible", { detail: img.caption, tone: img.is_active ? "info" : "success" });
                  }}
                  aria-pressed={img.is_active}
                  className={cn(
                    "ml-auto rounded-full border-2 border-on-surface px-3 py-1.5 text-xs font-label-bold uppercase transition-colors",
                    img.is_active ? "bg-success-mint" : "bg-surface-container"
                  )}
                >
                  {img.is_active ? "Visible" : "Hidden"}
                </button>
                <AdminActionButton
                  tone="danger"
                  icon="delete"
                  ariaLabel={`Delete ${img.caption}`}
                  onClick={() => {
                    deleteGalleryImage(img.id);
                    toast("Photo deleted", { detail: img.caption, tone: "info" });
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Photo" : "Add Photo"}
        subtitle="Alt text is required — it's how screen readers and SEO see the image."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editingId ? "Save Changes" : "Add Photo"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5">
          <Input label="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" icon="image" />
          <Input label="Alt text (required)" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what's in the photo…" icon="accessibility_new" />
          <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. The Sunday Pie" icon="edit_note" />
          {url.trim() && (
            <div className="overflow-hidden rounded-2xl radical-border">
              <img src={url} alt="Preview" className="aspect-video w-full object-cover" />
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
