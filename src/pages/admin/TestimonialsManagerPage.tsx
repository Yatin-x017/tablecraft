import { useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton, AdminSection } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TestimonialsManagerPage() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, moveTestimonial } = useAdminStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);

  const openCreate = () => {
    setName("");
    setQuote("");
    setRating(5);
    setModalOpen(true);
  };

  const save = () => {
    if (!name.trim() || !quote.trim()) {
      toast("Name and quote required", { tone: "error", detail: "Fill in both fields." });
      return;
    }
    addTestimonial({
      customer_name: name,
      customer_photo_url: null,
      rating,
      quote,
      is_approved: true,
      is_featured: testimonials.length < 3,
      display_order: testimonials.length + 1,
    });
    setModalOpen(false);
    toast("Testimonial added", { detail: name });
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Testimonials"
        subtitle="Approve, feature, and order the love notes from your regulars."
      />

      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <AdminActionButton icon="add_comment" onClick={openCreate}>Add testimonial</AdminActionButton>
      </div>

      <AdminSection
        title="Review Queue"
        subtitle="Featured testimonials appear on the public home page"
        actions={
          <span className="rounded-full border-2 border-on-surface bg-secondary-container px-3 py-1 font-label-bold text-label-bold uppercase">
            {testimonials.filter((t) => t.is_featured).length} featured
          </span>
        }
      >
        <ul className="divide-y-2 divide-surface-container">
          {testimonials.map((t, i) => (
            <li key={t.id} className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-background-cream md:flex-row md:items-center md:gap-6 md:px-8">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-on-surface font-bold", ["bg-primary-fixed-dim", "bg-secondary-fixed-dim", "bg-tertiary-fixed-dim", "bg-primary-fixed"][i % 4])}>
                {initials(t.customer_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-label-bold text-label-bold text-on-surface">{t.customer_name}</span>
                  <span className="inline-flex items-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Icon key={s} name="star" size="sm" className={s < t.rating ? "text-secondary" : "text-outline-variant"} filled={s < t.rating} />
                    ))}
                  </span>
                </div>
                <p className="mt-1 font-body-md text-on-surface-variant">“{t.quote}”</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <AdminActionButton icon="arrow_upward" ariaLabel="Move up" onClick={() => moveTestimonial(t.id, -1)} />
                <AdminActionButton icon="arrow_downward" ariaLabel="Move down" onClick={() => moveTestimonial(t.id, 1)} />
                <Toggle
                  checked={t.is_approved}
                  onCheckedChange={(approved) => {
                    updateTestimonial(t.id, { is_approved: approved });
                    toast(approved ? "Approved" : "Unapproved", { detail: t.customer_name, tone: approved ? "success" : "info" });
                  }}
                  label={t.is_approved ? "Approved" : "Pending"}
                />
                <Toggle
                  checked={t.is_featured}
                  onCheckedChange={(featured) => {
                    updateTestimonial(t.id, { is_featured: featured });
                    toast(featured ? "Featured on home" : "Removed from home", { detail: t.customer_name });
                  }}
                  label={t.is_featured ? "Featured" : "Home"}
                />
                <AdminActionButton
                  tone="danger"
                  icon="delete"
                  onClick={() => {
                    deleteTestimonial(t.id);
                    toast("Testimonial deleted", { detail: t.customer_name, tone: "info" });
                  }}
                >
                  Delete
                </AdminActionButton>
              </div>
            </li>
          ))}
          {testimonials.length === 0 && (
            <li className="px-8 py-16 text-center">
              <Icon name="rate_review" size="xl" className="mx-auto mb-4 text-primary" />
              <p className="font-headline-md text-headline-md text-on-surface">No reviews yet</p>
              <p className="mt-1 font-body-md text-on-surface-variant">Add the first love note.</p>
            </li>
          )}
        </ul>
      </AdminSection>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Testimonial"
        subtitle="Approved by default; featured only if it's home-worthy."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>Add Testimonial</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5">
          <Input label="Customer name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya R." icon="person" />
          <div>
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="t-rating">Rating</label>
            <select
              id="t-rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="h-14 w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 font-body-md focus:border-primary focus:outline-none"
            >
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>)}
            </select>
          </div>
          <label className="block">
            <span className="mb-2 block font-label-bold text-label-bold text-on-surface">Quote</span>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={4}
              placeholder="The Confetti Latte is pure joy in a mug…"
              className="w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 py-3 font-body-md placeholder:text-on-surface-variant/50 focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115] focus:outline-none"
            />
          </label>
        </div>
      </AdminModal>
    </div>
  );
}
