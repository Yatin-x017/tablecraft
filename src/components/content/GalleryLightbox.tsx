import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";

/**
 * Gallery grid with a keyboard-accessible lightbox.
 * No control relies on an icon alone — prev/next/close all carry labels.
 */
export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
    // Restore focus to the thumbnail that opened the lightbox.
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);
  const prev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog on open.
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, prev, next]);

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => {
                triggerRef.current = document.activeElement as HTMLButtonElement | null;
                setActiveIndex(i);
              }}
              className="group block w-full overflow-hidden rounded-[20px] border-2 border-on-surface bg-surface-white text-left shadow-[4px_4px_0_#231a11] transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`View larger: ${img.alt_text}`}
            >
              <div className="aspect-[4/3] overflow-hidden border-b-2 border-on-surface">
                <img
                  src={img.image_url}
                  alt={img.alt_text}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <p className="px-4 py-3 font-label-bold text-label-bold uppercase text-on-surface">{img.caption}</p>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-[20px] border-4 border-on-surface bg-surface-white shadow-[8px_8px_0_rgba(255,107,74,0.6)]">
              <img src={active.image_url} alt={active.alt_text} className="max-h-[70vh] w-full object-contain" />
              <div className="flex items-center justify-between gap-4 border-t-2 border-on-surface px-6 py-4">
                <div>
                  <p className="font-label-bold text-label-bold uppercase text-on-surface">{active.caption}</p>
                  <p className="font-body-sm text-on-surface-variant">
                    {activeIndex! + 1} of {images.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-4 py-2 font-label-bold text-label-bold uppercase transition-colors hover:bg-surface-container"
                    aria-label="Previous image"
                  >
                    <Icon name="chevron_left" size="sm" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-surface-white px-4 py-2 font-label-bold text-label-bold uppercase transition-colors hover:bg-surface-container"
                    aria-label="Next image"
                  >
                    <Icon name="chevron_right" size="sm" />
                  </button>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-on-surface bg-error-red px-4 py-2 font-label-bold text-label-bold uppercase text-white transition-colors hover:bg-error"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
