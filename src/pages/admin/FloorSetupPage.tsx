import { useState } from "react";
import { useAdminStore, type TableDraft } from "@/store/useAdminStore";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminActionButton } from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/Toast";
import { PageHeader } from "@/components/PageStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const SECTIONS = ["Window", "Counter", "Patio", "Party Corner"];

const emptyDraft = (): TableDraft => ({ tableNumber: "", section: "Window", capacity: 4, isActive: true });

export function FloorSetupPage() {
  const { tables, addTable, updateTable, deleteTable } = useAdminStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TableDraft>(emptyDraft());

  const capacityFor = (section: string) => tables.filter((t) => t.section === section && t.isActive).reduce((sum, t) => sum + t.capacity, 0);

  const save = () => {
    if (!draft.tableNumber.trim()) {
      toast("Table number required", { tone: "error", detail: "e.g. T13, A4…" });
      return;
    }
    addTable(draft);
    setModalOpen(false);
    setDraft(emptyDraft());
    toast("Table added", { detail: `${draft.tableNumber} · ${draft.section}` });
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Floor Setup"
        subtitle="Arrange tables by section and capacity — the booking engine auto-assigns best-fit tables from here."
      />

      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <AdminActionButton icon="add_circle" onClick={() => setModalOpen(true)}>Add table</AdminActionButton>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const sectionTables = tables.filter((t) => t.section === section);
          if (sectionTables.length === 0) return null;
          return (
            <section key={section} className="overflow-hidden rounded-[32px] radical-border radical-shadow bg-surface-white">
              <div className="flex items-center justify-between border-b-2 border-on-surface bg-surface-container-low px-6 py-4">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{section}</h3>
                  <p className="font-body-sm text-on-surface-variant">
                    {sectionTables.filter((t) => t.isActive).length} active · {capacityFor(section)} seats
                  </p>
                </div>
                <span className="rounded-full border-2 border-on-surface bg-secondary-container px-3 py-1 font-label-bold text-label-bold uppercase">
                  {sectionTables.length} tables
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
                {sectionTables.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-2xl border-2 border-on-surface p-4 transition-all",
                      t.isActive ? "bg-background-cream radical-shadow-sm" : "bg-surface-container opacity-60"
                    )}
                  >
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 border-on-surface", t.isActive ? "bg-primary-fixed" : "bg-surface-container-highest")}>
                      <Icon name="table_restaurant" size="sm" className={t.isActive ? "text-primary" : "text-on-surface-variant"} />
                    </span>
                    <span className="font-label-bold text-label-bold text-on-surface">{t.tableNumber}</span>
                    <span className="text-[11px] font-label-bold uppercase text-on-surface-variant">up to {t.capacity}</span>
                    <div className="mt-1 flex w-full items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          updateTable(t.id, { isActive: !t.isActive });
                          toast(t.isActive ? "Table offline" : "Table online", { detail: t.tableNumber, tone: t.isActive ? "info" : "success" });
                        }}
                        aria-pressed={t.isActive}
                        className={cn(
                          "rounded-full border-2 border-on-surface px-2.5 py-1 text-[10px] font-label-bold uppercase transition-colors",
                          t.isActive ? "bg-success-mint" : "bg-surface-container-highest"
                        )}
                      >
                        {t.isActive ? "Active" : "Offline"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTable(t.id)}
                        aria-label={`Delete ${t.tableNumber}`}
                        className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error-red"
                      >
                        <Icon name="delete" size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => { setDraft({ ...emptyDraft(), section }); setModalOpen(true); }}
                  className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="add" size="md" />
                  <span className="font-label-bold text-label-bold uppercase">Add to {section}</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Section legend */}
      <div className="mt-8 flex flex-wrap items-center gap-6 rounded-[20px] radical-border bg-on-surface px-6 py-5 text-surface-white">
        <span className="font-label-bold text-label-bold uppercase">Capacity legend</span>
        {[
          { n: "1–2", label: "Intimate nooks" },
          { n: "4–6", label: "Family tables" },
          { n: "8+", label: "Party corner" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-2 font-body-sm opacity-90">
            <span className="rounded-full border-2 border-surface-white/40 px-2.5 py-0.5 font-label-bold">{l.n}</span>
            {l.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 font-body-sm opacity-90">
          <span className="h-3 w-3 rounded-full bg-success-mint" /> Online · <span className="h-3 w-3 rounded-full bg-surface-container-highest" /> Offline
        </span>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Table"
        subtitle="Give the table a number, section, and capacity."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>Add Table</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Table number" value={draft.tableNumber} onChange={(e) => setDraft((d) => ({ ...d, tableNumber: e.target.value }))} placeholder="e.g. T13" icon="table_restaurant" />
          <div>
            <label className="mb-2 block font-label-bold text-label-bold text-on-surface" htmlFor="tbl-section">Section</label>
            <select
              id="tbl-section"
              value={draft.section}
              onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))}
              className="h-14 w-full rounded-lg border-2 border-on-surface bg-surface-white px-4 font-body-md focus:border-primary focus:outline-none"
            >
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input label="Capacity" type="number" min="1" max="20" value={draft.capacity === 0 ? "" : String(draft.capacity)} onChange={(e) => setDraft((d) => ({ ...d, capacity: Number(e.target.value) || 0 }))} placeholder="e.g. 4" icon="groups" />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
