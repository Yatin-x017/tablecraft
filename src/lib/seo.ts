import { useEffect } from "react";

const SITE_NAME = "Crumb & Confetti";

/**
 * Per-page SEO (P1 — PRD §6.1): sets document.title and the meta
 * description + Open Graph tags for the current page. Calling it with a
 * title/description restores a clean per-page state on unmount.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("property", "og:title", fullTitle);
      setMeta("property", "og:type", "website");
      setMeta("property", "og:site_name", SITE_NAME);
    }

    return () => {
      // Restore the site-wide defaults so a meta-less route (e.g. 404) never
      // inherits stale per-page title/OG values.
      const fallbackDescription = "Crumb & Confetti — artisanal pastries, craft coffee, and a daily dose of celebration. Book your table.";
      const fallbackTitle = `${SITE_NAME} — Baked with Joy`;
      document.title = fallbackTitle;
      const resets: Array<["name" | "property", string, string]> = [
        ["name", "description", fallbackDescription],
        ["property", "og:description", fallbackDescription],
        ["property", "og:title", fallbackTitle],
        ["property", "og:type", "website"],
        ["property", "og:site_name", SITE_NAME],
      ];
      for (const [attr, key, content] of resets) {
        const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
        if (el) el.setAttribute("content", content);
      }
    };
  }, [title, description]);
}
