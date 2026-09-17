import { PageHeader } from "@/components/PageStates";
import { Icon } from "@/components/ui/Icon";
import { usePageMeta } from "@/lib/seo";
import type { LegalSection } from "@/lib/legal";

interface LegalPageProps {
  title: string;
  updated: string;
  sections: LegalSection[];
}

/**
 * Static legal pages (Privacy Policy / Terms of Use).
 * Template content, developer-maintained — NOT editable in the CMS,
 * and explicitly flagged for the client's own legal review (TRD §8).
 * The section copy lives in lib/legal.ts so this component can be
 * lazy-loaded (code splitting) without dragging the data into App.
 */
export function LegalPage({ title, updated, sections }: LegalPageProps) {
  usePageMeta(title, `${title} for Crumb & Confetti — template content pending legal review.`);
  return (
    <div className="bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="Legal" title={title} />
        <p className="mb-10 inline-flex items-center gap-2 rounded-full border-2 border-on-surface bg-secondary-container/40 px-4 py-1.5 font-label-bold text-label-bold uppercase text-on-secondary-container">
          <Icon name="gavel" size="sm" /> Template content — updated {updated} · pending client legal review
        </p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i} className="rounded-[20px] border-2 border-on-surface bg-surface-white p-8 shadow-[4px_4px_0_#231a11]">
              <h2 className="mb-3 font-headline-md text-headline-md text-on-surface">
                {i + 1}. {s.heading}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
