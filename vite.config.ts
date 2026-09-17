import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Explicit, stable vendor chunk names (instead of Vite's auto-split)
        // so every library ships in a predictably named, cacheable chunk.
        // Dynamic-import-only libs (animejs, emailjs) stay on-demand.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Core UI runtime — cached across all routes
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          )
            return "react";

          // Motion — imported eagerly by the page shells
          if (
            id.includes("/node_modules/motion/") ||
            id.includes("/node_modules/motion-dom/") ||
            id.includes("/node_modules/motion-utils/")
          )
            return "motion";

          // Supabase client (lib/supabase.ts is eager). Note: this chunk is
          // only emitted once a .env defines VITE_SUPABASE_URL etc. — without
          // those, isSupabaseConfigured() is statically false and the SDK is
          // tree-shaken out of the build entirely.
          if (id.includes("/node_modules/@supabase/")) return "supabase";

          // Routing (react-router v7 re-exports via react-router-dom)
          if (
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/react-router-dom/")
          )
            return "router";

          // Global state (admin + booking stores)
          if (id.includes("/node_modules/zustand/")) return "state";

          // Form validation (GuestDetailsForm)
          if (id.includes("/node_modules/zod/")) return "validation";

          // On-demand: confetti + email — fetched only when used
          if (id.includes("/node_modules/animejs/")) return "anime";
          if (id.includes("/node_modules/@emailjs/")) return "emailjs";
        },
      },
    },
  },
});
