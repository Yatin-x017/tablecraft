import { useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminSection } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

export function SettingsPage() {
  const { settings, saveSettings } = useAdminStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...settings });
  const [dirty, setDirty] = useState(false);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const save = () => {
    saveSettings(form);
    setDirty(false);
    toast("Settings saved", { detail: "Changes are live on the public site." });
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Settings"
        subtitle="Business details, contact info, and social links — all surfaced across the site."
      />

      <div className="space-y-10">
        <AdminSection
          title="Business Profile"
          subtitle="The name and story that greet your guests."
        >
          <div className="grid grid-cols-1 gap-5 p-6 md:p-8 sm:grid-cols-2">
            <Input label="Business name" value={form.name} onChange={(e) => set({ name: e.target.value })} icon="storefront" />
            <Input label="Tagline" value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Baked with Joy" icon="auto_awesome" />
            <div className="sm:col-span-2">
              <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="set-desc">Description</label>
              <textarea
                id="set-desc"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 py-3 font-body-md placeholder:text-on-surface-variant/50 focus:border-primary focus:shadow-[4px_4px_0_0_#ae3115] focus:outline-none"
              />
            </div>
          </div>
        </AdminSection>

        <AdminSection
          title="Contact & Location"
          subtitle="Shown in the footer and on the contact page."
        >
          <div className="grid grid-cols-1 gap-5 p-6 md:p-8 sm:grid-cols-2">
            <Input label="Phone" value={form.phone} onChange={(e) => set({ phone: e.target.value })} icon="call" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} icon="mail" />
            <Input label="Address" value={form.address} onChange={(e) => set({ address: e.target.value })} icon="location_on" />
            <div className="grid grid-cols-2 gap-5">
              <Input label="City" value={form.city} onChange={(e) => set({ city: e.target.value })} />
              <Input label="Country" value={form.country} onChange={(e) => set({ country: e.target.value })} />
            </div>
            <Input label="Timezone" value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} icon="schedule" />
            <Input label="Currency" value={form.currency} onChange={(e) => set({ currency: e.target.value })} icon="payments" />
          </div>
        </AdminSection>

        <AdminSection
          title="Social Links"
          subtitle="Leave blank to hide a platform."
        >
          <div className="grid grid-cols-1 gap-5 p-6 md:p-8 sm:grid-cols-3">
            <Input label="Instagram" value={form.social_links.instagram ?? ""} onChange={(e) => set({ social_links: { ...form.social_links, instagram: e.target.value } })} placeholder="https://instagram.com/…" icon="photo_camera" />
            <Input label="Facebook" value={form.social_links.facebook ?? ""} onChange={(e) => set({ social_links: { ...form.social_links, facebook: e.target.value } })} placeholder="https://facebook.com/…" icon="facebook" />
            <Input label="TikTok" value={form.social_links.tiktok ?? ""} onChange={(e) => set({ social_links: { ...form.social_links, tiktok: e.target.value } })} placeholder="https://tiktok.com/@…" icon="music_note" />
          </div>
        </AdminSection>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] radical-border bg-surface-white p-6 radical-shadow">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-on-surface bg-secondary-fixed text-secondary">
              <Icon name="rocket_launch" size="sm" />
            </span>
            <div>
              <p className="font-label-bold text-label-bold uppercase text-on-surface">Your changes go live instantly</p>
              <p className="font-body-sm text-on-surface-variant">
                {dirty ? "You have unsaved changes." : "All saved — the site reflects these values everywhere."}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={save} disabled={!dirty}>
            {dirty ? "Save Changes" : "Saved ✓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
