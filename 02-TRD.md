# TableCraft — Technical Requirements Document (TRD)

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | July 23, 2026 |
| Companion docs | PRD, UI/UX Design, App Flow, Backend Schema, Implementation Plan |

---

## 1. Architecture Overview

TableCraft is a **single-tenant-per-deployment** application: one codebase, redeployed per client into its own Supabase project + Vercel project. There is no shared multi-tenant database — this keeps client data fully isolated and keeps the RLS policy set simple, at the cost of re-provisioning infrastructure per client (acceptable given the low client count this template targets).

```
┌─────────────────────────────┐
│   React SPA (Vite + TS)     │
│   deployed on Vercel         │
│                              │
│  Public site  |  Admin CMS   │
└───────┬──────────────┬──────┘
        │              │
        │  supabase-js │
        ▼              ▼
┌─────────────────────────────┐
│         Supabase            │
│  Postgres  · Auth  · Storage │
│  Realtime  · Edge Functions  │
└───────┬──────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   EmailJS (trial) —          │
│   client-side transactional  │
│   email: confirmations,      │
│   cancellations, reminders    │
│   [prod swap: Resend via     │
│   Edge Function, see §6]     │
└─────────────────────────────┘
```

No custom Node/Express backend is used — Supabase's Postgres RPC functions and Edge Functions serve as the entire backend layer, called directly from the client via `supabase-js` (all calls `async`/`await`, see §5). This keeps infra minimal and matches the established stack. For the trial build, email sits outside this diagram's Supabase box entirely — it's a direct client → EmailJS call, not a server-side hop.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | React 18 + TypeScript + Vite | Established stack |
| Styling | Tailwind CSS | Utility-first, pairs with Kokonut UI |
| State management | Zustand | Lightweight, established stack |
| Component library | Kokonut UI | shadcn/ui-based components (hero, cards, forms) — used for public site + admin shell |
| Charts (admin analytics) | Bklit UI | shadcn-based chart components (line/area/ring) — reservation volume, busiest days, menu-item views |
| Animation — micro-interactions | anime.js | Confetti-style bursts on booking confirmation, playful button/icon motion (fits the vibrant brand direction) |
| Animation — page/scroll | Motion (Motion.dev, successor to Framer Motion) | Page transitions, scroll reveals, layout animation |
| Backend / DB | Supabase (Postgres) | See Backend Schema doc for full table design |
| Auth | Supabase Auth | Guest-first flow; optional magic-link/email account creation at booking time; separate admin login |
| Storage | Supabase Storage | Menu images, gallery photos, blog cover images |
| Realtime | Supabase Realtime (Postgres CDC) | Admin reservations/floor view updates live as bookings come in |
| Email | **EmailJS** (client-side, `@emailjs/browser`) for the trial build | Confirmation, cancellation, reminder emails — sent directly from the browser after a successful RPC response, no Edge Function or server secret needed for trial. **Resend + Supabase Edge Function** remains the documented production-swap path (see 3.2 and 6) once the client is ready to move past trial |
| Hosting | Vercel | Frontend hosting + preview deployments per PR |
| Validation | Zod | Shared schema validation on all forms and RPC inputs |

## 3. Real-Time Reservation Engine (Core Technical Challenge)

Instant auto-confirmation with zero double-bookings is the hardest requirement in this system, so it gets a dedicated design:

**3.1 Conflict prevention — database-enforced, not app-enforced**
A Postgres `EXCLUDE` constraint (via the `btree_gist` extension) on the `reservations` table prevents two confirmed reservations from overlapping on the same table:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status = 'confirmed');
```

This means even under a race condition (two guests submitting the same slot within milliseconds), the database itself rejects the second overlapping insert — correctness doesn't depend on application-level locking.

**3.2 Booking flow — atomic RPC, not raw client inserts**
Guests never `INSERT` directly into `reservations`. A single Postgres function `book_reservation(...)` is exposed via RPC and does, in one transaction:
1. Validates the requested date/time against business hours + holiday closures
2. Finds the best-fit available table (smallest capacity that still fits the party size, in the requested section if specified)
3. Inserts the reservation row (relying on the exclusion constraint as the final correctness guarantee)
4. Returns a confirmation code
5. The client `await`s the RPC call (all reservation/admin data calls are `async`/`await`, never fire-and-forget for anything the UI depends on), then, on success, asynchronously fires an **EmailJS** send (`emailjs.send(...)`, awaited but non-blocking to the confirmation screen — errors are caught and surfaced as a small non-fatal toast, not a failed booking) with the confirmation code and cancel/reschedule link. This replaces the Postgres-trigger-via-`pg_net`-to-Resend design for the trial phase; that design is retained below as the production swap-in once a server secret and higher email volume justify it

**3.3 Optimistic UI**
The booking flow does not sit on a spinner waiting for round-trips it can reasonably predict the outcome of:
- On slot selection, the time grid updates its own "available/limited/full" state client-side the instant a selection is made, before re-confirming with the server
- On submit, the button moves to its loading state immediately and the confirmation screen (with the confetti moment) renders **optimistically** as soon as the `book_reservation` RPC resolves successfully — the UI does not wait on the EmailJS send to consider the booking "done"
- If the rare race-condition rejection happens (§3.1), the optimistic confirmation is rolled back to the availability screen with a clear "that slot was just taken" message and a refreshed slot list — the rollback path is a first-class state, not an afterthought
- The same pattern applies in the admin Reservations/Floor manager: cancel / no-show / mark-completed actions update the row locally the instant the admin clicks, then reconcile against the Realtime event that confirms it server-side (see 3.4); a failed action reverts the row and shows an inline error

**3.4 Live admin view**
The admin reservations/floor screen subscribes to a Supabase Realtime channel on the `reservations` table, so new bookings, cancellations, and no-shows appear instantly without a page refresh — this is also what reconciles the optimistic admin actions described in 3.3.

## 4. Auth Strategy

All of the below runs on **Supabase Auth** — there is no separate auth system for the Google path vs. the email path; every method resolves to the same `auth.users.id`, so RLS policies (§7, Schema §4) don't need to know or care which method a given user signed in with.

**4.1 Guests (unauthenticated booking)**
No auth required to book. At the confirmation step, guest can optionally "save my details," which creates a Supabase Auth account and links the reservation via `user_id`. Saving details offers the same three sign-up methods as 4.2.

**4.2 Customer accounts — sign-up/sign-in methods**
| Method | Flow | Verification |
|---|---|---|
| Magic link (existing default) | Enter email → click link → signed in | Implicitly verified — clicking the emailed link *is* the proof of email ownership |
| Email + password | Enter email, name, password → account created unconfirmed → **must click the verification email link before first login** | Supabase Auth's built-in email confirmation flow; unconfirmed accounts can't sign in or book under that account (guest booking still works meanwhile) |
| Google OAuth2 (new) | "Continue with Google" button → Google consent screen → returns to app signed in | Verified by Google — no separate email-verification step needed, matching Supabase Auth's default OAuth behavior |

**Forgot password:** for the email+password method only, Supabase Auth's built-in password-reset flow (request → emailed reset link → set new password). Magic-link and Google accounts have no password to forget by definition, so the UI only surfaces "Forgot password?" for accounts that used that method.

**4.3 Admin**
Same three methods are available to admins (email+password with verification + forgot-password, magic link, or Google OAuth), but an admin account only gets elevated access once its `auth.users.id` also has a row in `admins` — signing in via any method, including Google, does **not** by itself grant admin access. Admin routes check role server-side via RLS policies and an `is_admin()` Postgres function — never a client-side "is admin" flag alone. In practice this means: Google OAuth is convenient for login, but an owner still has to be provisioned as a row in `admins` first (done manually by Yatin during handoff, not self-service).

**4.4 Rate limiting on auth (see also §7)**
Sign-up, magic-link requests, and password-reset requests are all rate-limited per email/IP (Supabase Auth's built-in limits, backstopped by an Edge Function throttle if a client's volume needs tighter control) — this prevents both credential-stuffing attempts and email-bombing a guest's inbox with repeated magic-link/reset requests.

## 5. API / Data Access Pattern

No custom REST/GraphQL API layer is built. All data access goes through:
- **Direct `supabase-js` queries** for reads that are safe under RLS (menu, gallery, hours, published blog posts, approved testimonials)
- **RPC calls** for anything requiring server-side logic or elevated trust (`book_reservation`, `cancel_reservation`, `create_manual_reservation` for admin phone-in bookings)
- **EmailJS (trial)** for the confirmation/cancellation/reminder send itself, called client-side after a successful RPC (see 3.2); **Supabase Edge Functions** remain the documented path for anything requiring a real secret (e.g. Resend's API key, if/when that swap happens) or other third-party calls
- **Supabase Auth** (magic link, email+password incl. verification/reset, Google OAuth) for everything in §4 — none of it is hand-rolled

**Pagination — no unbounded reads:**
Every list view that can grow unbounded is paginated at the query level with `supabase-js`'s `.range(from, to)`, never fetched in full and sliced client-side:
- Admin: Reservations list, Blog/Events list, Testimonials list, Gallery manager
- Public: Blog/Events listing, Gallery grid (infinite-scroll or "load more" backed by `.range()`)
- Default page size 20 (configurable per view), with a total count via `{ count: 'exact' }` only where the UI needs "page X of Y" — otherwise a cheaper `{ count: 'estimated' }` or none at all

**No N+1 queries:**
Related data is always fetched via `supabase-js`'s relational embedding in a single query (e.g. `select('*, menu_categories(name), reservations(count)')`), never via a loop that issues one query per row. This applies especially to: menu items joined to categories, blog posts joined to authors, and any admin dashboard aggregate that would otherwise require per-row follow-up queries.

**Async everywhere:**
All `supabase-js` calls, RPC invocations, the EmailJS send, and every Supabase Auth call (sign-up, sign-in, OAuth redirect handling, password reset) are `async`/`await` with explicit `try/catch`, consistent loading state (see UI/UX doc — text labels, not just spinners) and error toasts. No unhandled promises, and no mixing of `.then()` chains with `async/await` in the same call site.

## 6. Third-Party Integrations

| Integration | Purpose |
|---|---|
| EmailJS (trial) | Transactional email (confirmation, cancellation, reminder) — client-side send, service ID/template ID/public key in frontend env vars, no server secret |
| Resend (production swap, not built for trial) | Same transactional emails via Supabase Edge Function once a server-side secret and Edge Function are warranted |
| Google OAuth2 (Supabase Auth provider) | "Continue with Google" sign-in/sign-up for customer accounts and admin login |
| Google Maps embed | Location/contact page |
| Supabase Storage | Image hosting for menu, gallery, blog covers |
| (Optional, per client) Instagram Basic Display | Live feed on homepage — flagged as P1, not core |

## 7. Security

- Row-Level Security (RLS) enabled on every table, no exceptions — this holds identically regardless of which auth method (magic link, email+password, Google) produced the session, since every policy checks `auth.uid()`/`is_admin()`, never the provider
- Public (anon) role: read-only on published/available content; write access limited to the `book_reservation`/`cancel_reservation` RPCs, never raw table writes
- Admin role: full CRUD, enforced via a Postgres role-check function referenced in every admin-scoped policy; being authenticated (by any method, including Google) is necessary but not sufficient — a matching `admins` row is required (§4.3)
- **Rate limiting**, applied at multiple layers, not just the booking RPC:
  - Booking RPC (via Supabase Edge Function wrapper) to prevent spam/abuse bookings
  - Auth endpoints — sign-up, magic-link send, password-reset send — rate-limited per email/IP (§4.4) to stop credential stuffing and inbox-bombing
  - EmailJS sends are debounced/guarded client-side so a double-click or retry loop can't fan out duplicate emails
  - Public read endpoints get Supabase's platform-level rate limits by default; nothing in this app needs to raise those limits for v1
- All form inputs validated with Zod on the client and re-validated server-side in the RPC (never trust client validation alone)
- Secrets (service role key, Google OAuth client secret, and — once the production email swap happens — Resend's API key) live only in Supabase Auth provider config / Edge Function environment variables, never shipped to the client bundle. EmailJS's public key and the Google OAuth **client ID** are both designed to be exposed client-side (they're not secrets), but the EmailJS template must be configured to only accept the fields the booking form actually sends, to reduce spam/abuse surface

## 8. Legal & Compliance

- **Privacy Policy & Terms of Use:** static, developer-maintained pages (not exposed in the owner's CMS — see Schema §7 for why). Yatin provides template copy covering data collected (reservation details, optional account info), how EmailJS/Resend and Supabase process it, and standard terms-of-use boilerplate. **This is template content, not legal advice** — each client is advised to have their own counsel review it before relying on it as their actual policy, same as any templated legal document.
- **Cookie consent:** a banner on first visit, blocking non-essential cookies (analytics, Instagram embed if enabled) until the visitor accepts; the essential Supabase Auth session cookie is exempt (not a marketing/tracking cookie, so it doesn't need consent under GDPR/CCPA-style frameworks). Preference is stored client-side; no personally identifying data is attached to the consent choice itself.
- **Data compliance posture:** data minimization by default (only what's needed to run a reservation — name/email/phone, party size, timestamps); a customer or guest requesting deletion is handled via the existing admin CRUD on `reservations`/`customer_profiles` (manual for v1, not a self-service "delete my data" button — flagged as a P1 if a client's jurisdiction requires it); no data is sold or shared with third parties beyond the processors already in this stack (Supabase, EmailJS/Resend, Google for OAuth)
- This section describes engineering posture, not a compliance certification (no SOC 2 / GDPR audit is in scope at this price tier) — it's designed to be reasonable and defensible, not to substitute for legal sign-off on a specific client's regulatory exposure

## 9. Performance

- Images served responsively (Supabase Storage transform or Vercel Image Optimization) with lazy loading below the fold
- Route-based code splitting (public site vs. admin bundle — admin code should never ship to guest visitors)
- All list-backed views (see §5) are paginated, not full-table reads, and joined data is fetched in a single embedded query rather than per-row — this is a performance requirement as much as a data-access pattern, since it's what keeps the admin dashboard and gallery/blog grids fast as content grows
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

## 10. DevOps

- GitHub repo (established: Yatin-x017 account pattern), `main` branch auto-deploys to production Vercel project
- Vercel preview deployments per pull request for client review before merge
- Two Supabase environments per client where budget allows (staging + production); for the $1,600 tier, a single production project with a documented manual migration process is the default (staging environment offered as an add-on)
- Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, etc.) documented in `.env.example`, never committed; Google OAuth client ID/secret are configured in the Supabase Auth dashboard, not as app env vars

## 11. Analytics (Admin Dashboard)

Built with Bklit UI chart components, reading aggregated views/queries (not raw table scans) for:
- Reservation volume over time (line/area chart)
- Busiest days/times heatmap-style view
- Most-viewed / most-featured menu items

## 12. Testing Strategy

- TypeScript strict mode as the first line of defense
- Manual QA checklist against PRD acceptance criteria before each client handoff (see Implementation Plan, Phase 5)
- Priority automated coverage (if timeline allows): the booking RPC's conflict-prevention logic, since it's the single highest-risk piece of business logic in the system
- Manual QA specifically for: all three sign-up/sign-in paths (magic link, email+password including the verification-email and forgot-password flows, Google OAuth), the admin `is_admin()` gate rejecting a non-admin authenticated user, and rate-limit behavior on repeated auth/booking attempts
