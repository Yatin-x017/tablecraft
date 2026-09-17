# TableCraft — Cafe & Bakery Reservation Platform
## Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | TableCraft (reusable template) |
| Case Study Brand | Crumb & Confetti (branded demo instance) |
| Version | 1.0 |
| Date | July 23, 2026 |
| Prepared by | Yatin — Freelance Web Developer |
| Commercial terms | $1,600 one-time build + $50/month maintenance |

---

## 1. Executive Summary

TableCraft is a reusable website template for cafes and bakeries that combines a beautifully animated public-facing site (menu, gallery, story, events) with a **real-time table reservation engine** and a **full admin CMS**. It is built once as a clean, well-architected codebase and re-skinned per client — the first fully branded instance is a fictional playful/vibrant bakery brand, **Crumb & Confetti**, used as the flagship portfolio case study.

Unlike a generic "restaurant website," this product treats reservations as a real inventory problem (tables, capacity, time slots, conflicts) rather than a contact form, and gives the owner full self-service control over content without touching code.

## 2. Problem Statement

Independent cafes and bakeries typically fall into one of two bad situations:
- A static Wix/Squarespace site with a "call us to book a table" note, which loses walk-in-adjacent bookings to whichever competitor has instant online booking.
- An expensive third-party reservation SaaS (OpenTable, Resy) that charges per-cover fees and buries the cafe's brand behind the platform's own UI.

Small independent cafe/bakery owners want their **own branded site** to feel alive and professional, with booking that "just works" instantly, and a simple way to update their menu, photos, hours, and specials themselves — without paying ongoing per-booking fees or waiting on a developer for every small change.

**Cost of not solving it:** lost reservations from friction (phone-tag, no live availability), an inconsistent brand experience, and recurring dependency on a developer for trivial content edits.

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Instant, frictionless booking | Time to complete a reservation (guest) | Under 60 seconds, 3 steps or fewer |
| Zero double-bookings | Table conflict incidents | 0 (enforced at DB level, not app logic) |
| Owner self-sufficiency | % of content changes owner makes without developer help | >90% (menu, gallery, hours, specials, testimonials) |
| Reusability for future clients | Time to re-skin template for a new client | Under 1 week (branding + content swap only, no re-architecture) |
| Portfolio conversion | Case study leads to inbound freelance inquiries | Qualitative — tracked via portfolio site referrals |

## 4. Target Users / Personas

**1. Guest Diner (primary customer)**
Wants to browse the menu, get a feel for the place, and lock in a table without calling during business hours. Mostly on mobile. May or may not want an account.

**2. Returning Regular**
Books here often, wants to save time by not re-typing details and likes seeing their booking history.

**3. Cafe Owner / Admin**
Non-technical. Runs the day-to-day: updates the menu when prices change, posts a "weekend special," uploads new pastry photos, manages the reservation book, and blocks out holiday closures. Checks a simple dashboard to see how busy the week looks.

**4. Front-of-house Staff (secondary admin)**
May need to view/manage the day's reservations and floor without full settings access (see Open Questions — role granularity is a v1.1 decision).

## 5. Scope

### In Scope (v1)
- Public marketing site: Home, Menu, Gallery, Blog/Events/Specials, About/Story, Testimonials, Contact
- Legal & compliance pages: Privacy Policy, Terms of Use, and a cookie consent banner (template content — see §10 note on legal review)
- Real-time table reservation system with instant auto-confirmation
- Guest booking (no account required) with optional account creation — magic link, email+password (with email verification and forgot-password reset), or Google OAuth2 — for booking history
- Admin CMS: menu, categories & prices; gallery; reservations & table/floor setup; blog/events/specials posts; business hours & holiday closures; testimonials
- Email-only transactional notifications (confirmation, cancellation, reminder)
- One fully branded case-study instance (Crumb & Confetti) with real illustrated content for the portfolio

### Out of Scope (v1) — Non-Goals
| Non-goal | Why it's out of scope |
|---|---|
| Online food ordering / payment checkout | Confirmed scope is menu showcase + reservations only; ordering is a distinct, higher-complexity system (cart, payment, fulfillment) — future upsell |
| SMS / WhatsApp notifications | Client base is international/US-first and email-only was explicitly requested; WhatsApp/SMS add per-message cost and provider complexity |
| Multi-location / chain management | v1 targets a single physical location per deployment; each client gets their own instance, not a shared multi-tenant system |
| Loyalty / rewards program | Adds account-system complexity not justified without ordering/payment in place |
| Native mobile app | Responsive web covers the mobile use case; no app-store distribution planned |
| Deposit / prepayment for reservations | No payment provider is in scope for v1; can be added later if no-show rates justify it |

## 6. Functional Requirements

Priority key: **P0** = must-have for launch, **P1** = fast-follow, **P2** = designed for, not built now.

### 6.1 Public Site
- **P0** — Home page with hero, featured menu items, live availability teaser, and CTA to book
- **P0** — Menu page grouped by category, with dietary tags (vegan/gluten-free/nut-free), item images, and featured items
- **P0** — Photo gallery (grid, lightbox view)
- **P0** — Blog/Events/Specials listing + detail page (supports "event" posts with a date, e.g. live music night)
- **P0** — About/Story page
- **P0** — Testimonials section (site-wide and/or dedicated page)
- **P0** — Contact page with map embed, hours, and social links
- **P0** — Privacy Policy and Terms of Use pages (static, developer-maintained template content — see §10)
- **P0** — Cookie consent banner, blocking non-essential cookies until accepted
- **P1** — SEO metadata + Open Graph previews per page
- **P1** — Newsletter signup capture (email only, stored for owner's own use — no ESP integration in v1)

### 6.2 Reservation Engine
- **P0** — Guest can view real-time availability by date, time, and party size
- **P0** — System auto-assigns a suitable table (by capacity/section) and confirms instantly — no manual owner approval step
- **P0** — Guest receives instant email confirmation with a cancellation link
- **P0** — Guest can cancel/reschedule via a secure link (no login required)
- **P0** — Double-booking is structurally impossible (enforced at the database level, not just app logic)
- **P0** — Booking respects business hours and holiday closures automatically (closed slots simply aren't offered)
- **P1** — Optional account creation at time of booking to save history, via magic link, email+password (email verification required, forgot-password reset available), or Google OAuth2
- **P1** — Returning account holder sees past/upcoming reservations and can rebook in one tap
- **P2** — Deposit/prepayment for large parties (designed for, not built)
- **P2** — Waitlist when fully booked (designed for, not built)

**Acceptance criteria — instant booking (P0):**
- [ ] Given a guest selects a date, time, and party size, when a table with sufficient capacity is free, then the reservation is confirmed immediately without owner action
- [ ] Given a guest selects a fully-booked date/time/party-size combination, then that slot is not shown as available in the first place
- [ ] Given two guests attempt to book the last available table for the same slot within milliseconds of each other, then exactly one booking succeeds and the other sees an updated (unavailable) state
- [ ] Given a confirmed reservation, when the guest clicks "cancel" from their email, then the table is released back into the availability pool immediately

### 6.3 Admin CMS
- **P0** — Secure admin login (separate from guest accounts): email+password with verification/forgot-password, magic link, or Google OAuth2 — any method, but only once provisioned as an admin row (see TRD §4.3)
- **P0** — Menu manager: CRUD categories and items (name, description, price, image, dietary tags, availability toggle, display order)
- **P0** — Gallery manager: upload/reorder/remove photos
- **P0** — Reservations manager: calendar/list view of bookings, manual cancel, mark no-show/completed, add a manual/phone-in booking
- **P0** — Table/floor setup: define tables, capacity, and section
- **P0** — Blog/Events manager: create/edit/publish posts, mark as "event" with a date
- **P0** — Business hours & holiday closures manager
- **P0** — Testimonials manager: add/approve/feature/reorder
- **P1** — Simple analytics dashboard: reservation volume over time, busiest days/times, most-viewed menu items
- **P2** — Multiple staff roles with scoped permissions (owner vs. front-of-house)

## 7. User Stories (selected, see App Flow doc for full flows)

- As a guest, I want to see real table availability before I commit, so I don't get a "sorry, fully booked" surprise after entering my details.
- As a guest, I want to book a table without creating an account, so a quick lunch reservation doesn't feel like a chore.
- As a returning guest, I want to optionally save my details, so my next booking takes five seconds.
- As the owner, I want to update this week's specials myself, so I'm not paying a developer for a text change.
- As the owner, I want to see today's reservations at a glance, so I can prep the floor before service.
- As the owner, I want to block off a holiday, so the system stops taking bookings for that day automatically.

## 8. Non-Functional Requirements

- **Performance:** Largest Contentful Paint under 2.5s on 4G; menu/gallery images lazy-loaded and served responsively
- **Availability:** 99.5% uptime target (bounded by Supabase/Vercel SLAs on their respective plans)
- **Accessibility:** WCAG 2.1 AA — critical given the bold/vibrant palette, color contrast is explicitly checked (see UI/UX doc); no interactive control (public or admin) relies on an icon alone — every one gets a visible text label or an `aria-label` plus a hover/focus tooltip
- **Scalability of list views:** reservations, gallery, blog/events, and testimonials are read via paginated queries as data volume grows, not full-table fetches — this is a stated NFR, not left implicit (see TRD §5, §8)
- **Security:** Row-Level Security enforced at the database layer for every table, identically regardless of auth method (magic link, email+password, Google OAuth); admin routes gated by role, not just hidden UI; rate limiting applied to auth endpoints (sign-up, magic link, password reset) as well as the booking RPC, not just the latter
- **Data integrity:** Reservation conflicts prevented by a database constraint, not application-level checks alone
- **Legal & data compliance:** Privacy Policy, Terms of Use, and a cookie consent banner ship with every deployment as a baseline posture (data minimization, no third-party data sale); this is engineering best-effort, not a substitute for the client's own legal review (see TRD §8)
- **Portability:** Codebase must support re-branding (colors, fonts, copy, images) for a new client without structural rewrites

## 9. Commercial Terms

**One-time build fee: $1,600** includes:
- This full discovery/spec package (PRD, TRD, UI/UX, App Flow, Schema, Implementation Plan)
- Design system + one fully branded case-study build (Crumb & Confetti)
- All P0 features listed above, built and deployed
- Up to 2 rounds of revisions post-delivery
- Basic handoff training (admin CMS walkthrough, ~30 min recorded video)

**Monthly maintenance: $50/month** includes:
- Vercel + Supabase project hosting/monitoring
- Dependency & security updates
- Uptime and email-deliverability monitoring
- Up to 2 hours/month of minor content or copy tweaks
- Priority bug-fix response (best-effort, not a formal SLA)

Not included: domain registration/renewal, stock photography/licensed images, copywriting for client-specific content, and any P1/P2 feature build-out (quoted separately).

## 10. Assumptions & Constraints

- Each client deployment is a **separate Supabase project + Vercel project** from the same codebase — this is a single-tenant-per-deployment model, not a shared multi-tenant SaaS
- Client supplies their own menu content, photography (or approves stock alternatives), and business details
- One business location per deployment in v1
- English-only content in v1 (i18n not in scope)
- USD pricing displayed on the case study; currency is a config value per deployment, not hardcoded
- Privacy Policy and Terms of Use are provided as template copy authored by Yatin, not by a lawyer — each client is responsible for having their own counsel review this content before treating it as their actual legal policy; this is standard practice for template legal pages, not unique to this build

## 11. Open Questions

| Question | Who answers | Blocking? |
|---|---|---|
| Should front-of-house staff get a scoped-down admin role in v1.1, or is owner-only sufficient for now? | Yatin (product decision) | No — can ship v1 with single admin role |
| What's the standard reservation slot length/turnover time to default to (e.g., 90 minutes) per new client? | Set per-client during onboarding | No — configurable, has a sensible default |
| Do future clients need multi-language support? | Assess per client | No — not in current scope |
| When does a client move off the trial's EmailJS integration onto Resend + Edge Function? | Yatin (technical decision), triggered by a given client's volume/branding needs | No — trial ships first, swap path already documented (TRD §3.2, §6) |

## 12. Roadmap / Future Phases

- **Phase 2:** Online ordering + payment checkout (Stripe), pickup/delivery flows
- **Phase 2:** SMS/WhatsApp reminders for clients who want them
- **Phase 3:** Loyalty/rewards program tied to accounts
- **Phase 3:** Multi-location support for chains
- **Phase 3:** Waitlist + deposit/prepayment for high-demand slots
