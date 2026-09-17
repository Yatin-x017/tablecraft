# TableCraft — Crumb & Confetti

Cafe & bakery reservation platform (Crumb & Confetti branded case study).
Vite + React + TypeScript SPA with a Supabase backend, admin CMS, and a
full booking flow.

## Project structure

```
├── src/                  # Application code
│   ├── components/       # UI + layout + section components
│   ├── pages/            # Route pages (public + admin/)
│   ├── lib/              # API clients, auth, SEO, helpers
│   ├── store/            # Zustand stores (booking, admin)
│   └── styles in index.css (design tokens @theme)
├── docs/                 # Product & engineering documentation
├── design/               # Stitch mockups + design system source of truth
├── supabase/migrations/  # SQL schema migrations (ordered)
├── scripts/              # Migration validation tooling
├── index.html            # Vite entry
└── vite.config.ts        # Build config (vendor chunking)
```

### docs/ — read in order

| File | What it covers |
|---|---|
| `01-PRD.md` | Product requirements |
| `02-TRD.md` | Technical architecture |
| `03-UIUX-Design.md` | UI/UX spec (pairs with `design/DESIGN.md`) |
| `04-User-Flow-AppFlow.md` | Flows & information architecture |
| `05-Backend-Schema.md` | Database schema (mirrored in migrations) |
| `06-Implementation-Plan.md` | Phased build plan |
| `07-Deployment-Caching.md` | Deploy & caching strategy |
| `08-Admin-Handoff.md` | Client/staff handoff guide |

### design/

- `DESIGN.md` — design tokens: colors, type, radius, spacing (source of truth,
  mirrored into `src/index.css` `@theme`)
- `<screen>/code.html` + `screen.png` — per-screen mockups the pages were
  ported from (e.g. `home_crumb_confetti/`, `menu_manager_crumb_confetti_admin/`)

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b --noEmit
npm run preview      # Serve the production build
npm run validate:migrations
```

## Setup

Copy `.env.example` to `.env` and fill in the Supabase project URL + anon
key (Project Settings → API) and EmailJS keys for transactional email.
