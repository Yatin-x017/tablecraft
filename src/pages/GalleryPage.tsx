import { useEffect, useState } from "react";
import { fetchGallery } from "@/lib/api";
import type { GalleryImage } from "@/lib/content";
import { PageHeader, LoadingState, ErrorState } from "@/components/PageStates";
import { GalleryLightbox } from "@/components/content/GalleryLightbox";
import { Reveal } from "@/components/motion/Reveal";
import { usePageMeta } from "@/lib/seo";

/** Public gallery — grid + lightbox (PRD §6.1 — P0, Phase 1). */
export function GalleryPage() {
  usePageMeta("Gallery", "A peek inside Crumb & Confetti — fresh from the oven, the counter, and the cake corner.");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGallery();
      setImages(data.filter((g) => g.is_active));
    } catch {
      setError("The gallery photos are taking a moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="relative overflow-hidden bg-background-cream px-margin-mobile py-16 md:px-margin-desktop md:py-20">
      <div aria-hidden="true" className="sprinkle-pattern pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-container-max">
        <PageHeader
          eyebrow="A peek inside"
          title="Gallery"
          subtitle="Fresh from the oven, the counter, and the cake corner. Click any photo to take a closer look."
        />
        {loading ? (
          <LoadingState label="Polishing photos" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <Reveal>
            <GalleryLightbox images={images} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
