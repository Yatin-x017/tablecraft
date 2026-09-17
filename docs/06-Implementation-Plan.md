# TableCraft — Implementation Plan

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | July 23, 2026 |
| Timeline | ~5 weeks, solo build |
| Budget | $1,600 one-time + $50/month maintenance |

---

## Phase 0 — Setup & Foundations (pre-Week 1)

- [x] Discovery & requirements gathering (this doc set)
- [ ] Initialize repo: React + TypeScript + Vite, Tailwind CSS config
- [ ] Create Supabase project (production); apply schema migration from Backend Schema doc
- [ ] Create Vercel project, connect repo, configure environment variables
- [ ] Install & configure Kokonut UI components, Bklit UI charts, Motion, anime.js
- [ ] Define design tokens in Tailwind config (colors, type scale, radius, shadows) per UI/UX doc
- [ ] Set up EmailJS account (service + templates) for trial transactional email — client-side integration, no Edge Function needed yet; Resend + Edge Function documented as the production swap-in (see TRD §3.2, §6) when warranted
- [ ] Configure Supabase Auth: enable email+password (with email confirmation required), magic link, and the Google OAuth2 provider (client ID/secret from Google Cloud Console); customize the verification-email and password-reset email templates to match brand
- [ ] Draft Privacy Policy and Terms of Use template pages, and the cookie consent banner copy — flagged for client legal review before production launch (see PRD §10, TRD §8)

**Exit criteria:** empty-but-styled app deploys successfully to a Vercel preview URL; Supabase schema is live with RLS enabled on every table.

## Phase 1 — Public Site Core (Week 1)

- [ ] Home page: hero, featured menu teaser, testimonials strip, footer
- [ ] Menu page: category tabs, item cards, dietary tag badges
- [ ] Gallery page: grid + lightbox
- [ ] About/Story page
- [ ] Contact page: map embed, hours display, social links
- [ ] Blog/Events listing + detail page (content model wired, no posts yet), paginated via `.range()` rather than fetched in full
- [ ] Privacy Policy and Terms of Use pages (static, developer-maintained, not owner-editable — see Schema §4) and the cookie consent banner, gating non-essential cookies until accepted
- [ ] All pages responsive across the three breakpoints defined in the UI/UX doc
- [ ] All data fetches on public pages are `async`/`await` with loading and error states (text-labeled, not icon-only) — established as the pattern before Phase 2/3 build on top of it

**Exit criteria:** every public page renders real (placeholder) content from Supabase, fully responsive, no reservation functionality yet.

## Phase 2 — Reservation Engine (Week 2)

- [ ] Apply the `no_overlapping_reservations` exclusion constraint (requires `btree_gist`)
- [ ] Build `book_reservation()` Postgres function: validates hours/holidays, auto-assigns best-fit table, inserts atomically, returns confirmation code
- [ ] Build `cancel_reservation()` function, exposed via secure link (confirmation code, not just guessable ID)
- [ ] Build guest-facing booking UI: date → party size → available times → guest details → confirmation, with text labels on every control (no icon-only submit/step actions) and tooltips on any icon-first affordance (e.g. dietary-tag icons carried over from the menu)
- [ ] Optimistic confirmation screen: renders as soon as `book_reservation` resolves, with a defined rollback state for the race-condition case (§4 Edge Cases) — not just a spinner-then-success path
- [ ] Wire confirmation email via EmailJS (trial, client-side, `async`/`await`, non-blocking to the confirmation screen); document the Resend + Edge Function swap path for later without building it now
- [ ] Enable Supabase Realtime on `reservations` for the (not-yet-built) admin view
- [ ] Optional-account flow at confirmation step: magic-link, email+password (with the verification-email and forgot-password screens from the App Flow doc §2a), or Google OAuth — and rate limiting on magic-link/verification/reset requests

**Exit criteria:** all P0 acceptance criteria from the PRD's reservation section pass manual testing, including the concurrent-booking race-condition case and the optimistic-confirmation rollback path.

## Phase 3 — Admin CMS (Week 3)

- [ ] Admin auth (separate from customer accounts): all three sign-in methods available, but access gated by `is_admin()`-checked routes — being authenticated isn't enough, an `admins` row is required (see TRD §4.3, provisioned manually by Yatin during handoff)
- [ ] Menu manager (CRUD categories & items)
- [ ] Gallery manager (upload/reorder/remove, alt-text required)
- [ ] Blog/Events manager (create/edit/publish, event-date field)
- [ ] Hours & holiday closures manager
- [ ] Testimonials manager (approve/feature/reorder)
- [ ] Reservations & floor manager: live list (Realtime), manual phone-in booking, cancel/no-show/complete actions — all three implemented as optimistic UI updates reconciled by the Realtime event, not a wait-for-server spinner
- [ ] Dashboard: Bklit UI charts for reservation volume, busiest days/times, top menu items
- [ ] Every admin list view (reservations, gallery, blog/events, testimonials) is paginated via `.range()` with a consistent default page size, and every joined read (e.g. reservations with their table/section) uses a single embedded `supabase-js` query — no per-row N+1 follow-up calls
- [ ] Every row action across the admin CMS carries a visible text label or an `aria-label` + tooltip — audit icon-only buttons (delete/reorder/cancel icons especially) before calling this phase done

**Exit criteria:** owner can perform every P0 content-management task listed in the PRD without touching code, list views stay responsive as data grows, and no admin control relies on an icon alone to communicate its function.

## Phase 4 — Animation & Polish (Week 4)

- [ ] anime.js: confetti burst on booking confirmation, button hover micro-interactions
- [ ] Motion: page transitions, scroll-reveal on menu/gallery/blog cards, hero entrance
- [ ] `prefers-reduced-motion` handling across all animated elements
- [ ] Full accessibility pass: contrast check on every color pairing, keyboard navigation through the booking flow, focus rings, ARIA live region on availability updates, and a final sweep for icon-only controls missing a text label/`aria-label`/tooltip
- [ ] QA pass on optimistic UI paths specifically: booking confirmation, its race-condition rollback, and every admin optimistic action (cancel/no-show/complete/manual booking) — confirm each has a correct success state and a correct failure/revert state, not just the happy path
- [ ] QA pass on all three auth paths (magic link, email+password incl. verification/reset, Google OAuth), the `is_admin()` gate rejecting a non-admin authenticated user, and rate-limit behavior on repeated auth attempts
- [ ] Performance pass: image optimization/lazy loading, code splitting between public site and admin bundle

**Exit criteria:** Core Web Vitals targets met (LCP < 2.5s, CLS < 0.1, INP < 200ms); WCAG AA spot-checks pass.

## Phase 5 — QA, Case Study Branding, Deployment & Handoff (Week 5)

- [ ] Populate the full Crumb & Confetti case-study brand: illustrated assets, real copy, menu, gallery photos, sample blog/event posts, testimonials
- [ ] Flag Privacy Policy / Terms of Use template copy to the client for their own legal review before the site is treated as production-live for a real business
- [ ] Full manual QA against every acceptance criterion in the PRD
- [ ] Cross-browser/device spot-check (Chrome, Safari, mobile Safari, Android Chrome)
- [ ] Production deployment (Vercel production + Supabase production project)
- [ ] Record ~30-minute admin CMS walkthrough video for handoff
- [ ] Deliver all six planning documents + repo access

**Exit criteria:** live, production-deployed Crumb & Confetti site; client (or portfolio viewer) can complete a full reservation end-to-end; owner has been trained on the CMS.

---

## Ongoing Maintenance ($50/month)

| Task | Cadence |
|---|---|
| Dependency & security updates | Monthly |
| Uptime + email deliverability monitoring | Continuous |
| Minor content/copy tweaks (up to 2 hrs) | As requested |
| Priority bug-fix response | Best-effort, as needed |
| Monthly health-check summary to client | Monthly |

## Deliverables Checklist (Handoff)

- [ ] Production site URL (custom domain if provided by client)
- [ ] Admin login credentials
- [ ] Repo access (GitHub)
- [ ] All six planning documents (PRD, TRD, UI/UX, App Flow, Schema, this plan)
- [ ] Admin CMS walkthrough recording
- [ ] `.env.example` with all required environment variables documented, plus a note on where the Google OAuth client ID/secret are configured (Supabase Auth dashboard, not the repo)
- [ ] Privacy Policy / Terms of Use pages, clearly flagged to the client as template content pending their legal review

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Race conditions cause double-bookings | Mitigated structurally via the database exclusion constraint, not app-level logic alone |
| Vibrant color palette fails accessibility contrast | Every pairing explicitly checked in Phase 4, not assumed from the palette alone |
| Re-skinning for a future client takes longer than planned | Design tokens are centralized (Tailwind config + a few brand constants), not hardcoded per-component |
| Owner needs a feature outside v1 scope | Captured in the PRD's roadmap section as a separately quoted Phase 2/3 addition, not silently absorbed into this build |
| EmailJS (trial) hits deliverability, volume, or branding limits Resend would handle better | Swap path to Resend + Supabase Edge Function is already documented (TRD §3.2, §6; Schema §7) — a config/infra change, not a re-architecture, so it can be made before a given client's production handoff without touching the booking flow's core logic |
| Client treats the template Privacy Policy / Terms of Use as final without legal review | Explicitly flagged at handoff (Phase 5, Deliverables Checklist) as template content requiring the client's own counsel — not silently presented as compliant legal advice |
