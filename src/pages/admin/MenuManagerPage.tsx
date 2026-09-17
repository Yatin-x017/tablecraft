import { useMemo, useState } from "react";
import { useAdminStore, type MenuItemDraft } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = ["vegetarian", "vegan", "gluten-free", "nut-free"];

const emptyDraft = (categoryId: string): MenuItemDraft => ({
  category_id: categoryId,
  name: "",
  description: "",
  price: 0,
  image_url: "",
  dietary_tags: [],
  is_featured: false,
  is_available: true,
  display_order: 99,
});

export function MenuManagerPage() {
  const { categories, items, addItem, updateItem, deleteItem } = useAdminStore();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MenuItemDraft>(emptyDraft(categories[0]?.id ?? ""));
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesCat = activeCat === "all" || i.category_id === activeCat;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [items, activeCat, query]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(activeCat !== "all" ? activeCat : (categories[0]?.id ?? "")));
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setDraft({
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      dietary_tags: item.dietary_tags,
      is_featured: item.is_featured,
      is_available: item.is_available,
      display_order: item.display_order,
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) {
      toast("Name required", { tone: "error", detail: "Give this treat a name." });
      return;
    }
    if (editingId) {
      updateItem(editingId, draft);
      toast("Item updated", { detail: draft.name });
    } else {
      addItem(draft);
      toast("Item added", { detail: draft.name });
    }
    setModalOpen(false);
  };

  const toggleTag = (tag: string) => {
    setDraft((d) => ({
      ...d,
      dietary_tags: d.dietary_tags.includes(tag) ? d.dietary_tags.filter((t) => t !== tag) : [...d.dietary_tags, tag],
    }));
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Menu Manager"
        subtitle="Curate your delightful offerings, update daily specials, and sprinkle some digital magic on your storefront."
      />

      {/* Controls */}
      <div className="mb-12 grid grid-cols-1 items-center gap-gutter md:grid-cols-12">
        <div className="relative md:col-span-5">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-on-surface-variant" aria-hidden="true">
            <Icon name="search" size="sm" />
          </span>
          <label className="sr-only" htmlFor="menu-search">Search menu items</label>
          <input
            id="menu-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a tasty treat..."
            className="w-full rounded-2xl radical-border radical-shadow bg-surface-white py-4 pl-12 pr-4 font-body-md placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-7">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={cn(
              "rounded-2xl px-6 py-3 font-label-bold text-label-bold uppercase transition-colors",
              activeCat === "all"
                ? "radical-border radical-shadow-sm bg-secondary-container hover:bg-secondary"
                : "radical-border radical-shadow-sm bg-surface-white hover:bg-secondary-container"
            )}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "rounded-2xl px-6 py-3 font-label-bold text-label-bold uppercase transition-colors",
                activeCat === c.id
                  ? "radical-border radical-shadow-sm bg-secondary-container hover:bg-secondary"
                  : "radical-border radical-shadow-sm bg-surface-white hover:bg-secondary-container"
              )}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-center rounded-xl border-2 border-on-surface bg-primary-container px-6 py-3 font-label-bold text-label-bold uppercase radical-shadow radical-button-press text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary md:ml-auto"
          >
            <Icon name="add_circle" size="sm" /> Add Item
          </button>
        </div>
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => {
          const category = categories.find((c) => c.id === item.category_id);
          return (
            <article
              key={item.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-[32px] radical-border radical-shadow bg-surface-white p-4 transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
                {item.is_featured && (
                  <Badge variant="secondary" className="text-xs">Bestseller</Badge>
                )}
                {!item.is_available && (
                  <Badge variant="error" className="text-xs">Sold Out</Badge>
                )}
              </div>
              <div className="radical-border mb-4 aspect-square w-full overflow-hidden rounded-2xl">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                      !item.is_available && "opacity-50 grayscale"
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-container text-on-surface-variant">
                    <Icon name="bakery_dining" size="xl" />
                  </div>
                )}
              </div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">{item.name}</h3>
                <span className="shrink-0 font-bold text-primary">${item.price.toFixed(2)}</span>
              </div>
              <p className="mb-4 flex-grow font-body-sm text-on-surface-variant">{item.description}</p>
              {item.dietary_tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {item.dietary_tags.map((t) => (
                    <span key={t} className="rounded-full border-2 border-on-surface bg-surface-container px-2.5 py-0.5 text-[10px] font-label-bold uppercase text-on-surface-variant">
                      {t.replace("-", " ")}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t-2 border-dashed border-outline-variant py-4">
                <Toggle
                  checked={item.is_available}
                  onCheckedChange={(checked) => {
                    updateItem(item.id, { is_available: checked });
                    toast(checked ? "Back in stock" : "Marked sold out", { detail: item.name });
                  }}
                  label={item.is_available ? "Available" : "Sold Out"}
                  id={`avail-${item.id}`}
                />
                <span className="font-body-sm text-on-surface-variant">{category?.name}</span>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <AdminActionButton icon="edit" onClick={() => openEdit(item.id)}>Edit</AdminActionButton>
                <AdminActionButton icon="delete" tone="danger" onClick={() => setConfirmDelete(item.id)}>Delete</AdminActionButton>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-[32px] radical-border radical-shadow bg-surface-white p-12 text-center">
            <Icon name="search_off" size="xl" className="mx-auto mb-4 text-primary" />
            <p className="font-headline-md text-headline-md text-on-surface">No treats found</p>
            <p className="mt-2 font-body-md text-on-surface-variant">Try a different search or category.</p>
          </div>
        )}
      </div>

      <div className="mt-24 flex justify-center opacity-20 select-none" aria-hidden="true">
        <Icon name="auto_awesome" size="xl" />
      </div>

      {/* Add / Edit modal */}
      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Item" : "Add New Item"}
        subtitle={editingId ? "Tweak this treat's details." : "Sprinkle a new treat onto the menu."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editingId ? "Save Changes" : "Add Item"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Item name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Honey Pistachio Danish" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Image URL" value={draft.image_url} onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))} placeholder="https://…" icon="image" />
          </div>
          <div>
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="item-category">Category</label>
            <select
              id="item-category"
              value={draft.category_id}
              onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))}
              className="h-14 w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 font-body-md focus:border-primary focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Input label="Price (USD)" type="number" min="0" step="0.01" value={draft.price === 0 ? "" : String(draft.price)} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) || 0 }))} placeholder="0.00" icon="payments" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface">Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={draft.dietary_tags.includes(tag)}
                  className={cn(
                    "rounded-full border-2 border-on-surface px-4 py-2 font-label-bold text-label-bold uppercase transition-colors",
                    draft.dietary_tags.includes(tag) ? "bg-success-mint radical-shadow-sm" : "bg-surface-container hover:bg-surface-container-high"
                  )}
                >
                  {tag.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="item-desc">Description</label>
            <textarea
              id="item-desc"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              placeholder="What makes this one special?"
              className="w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 py-3 font-body-md placeholder:text-on-surface-variant/50 focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-6">
            <Toggle
              checked={draft.is_available}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_available: checked }))}
              label="Available"
            />
            <Toggle
              checked={draft.is_featured}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_featured: checked }))}
              label="Bestseller"
            />
          </div>
        </div>
      </AdminModal>

      {/* Delete confirm modal */}
      <AdminModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this item?"
        subtitle="This treat will be removed from the menu. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep It</Button>
            <Button variant="tertiary" onClick={() => {
              const item = items.find((i) => i.id === confirmDelete);
              if (confirmDelete) deleteItem(confirmDelete);
              setConfirmDelete(null);
              toast("Item deleted", { detail: item?.name, tone: "info" });
            }}>
              Delete Item
            </Button>
          </>
        }
      >
        <p className="font-body-md text-on-surface-variant">
          Are you sure you want to remove <span className="font-bold text-on-surface">{items.find((i) => i.id === confirmDelete)?.name ?? "this item"}</span>?
          It will disappear from the public menu immediately.
        </p>
      </AdminModal>
    </div>
  );
}
