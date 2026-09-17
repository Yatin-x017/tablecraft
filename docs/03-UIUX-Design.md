# TableCraft — UI/UX Design Document
### Branded case study: Crumb & Confetti

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | July 23, 2026 |
| Aesthetic direction | Playful / vibrant — bold color, illustrated, confetti-and-pastry motifs |
| Component base | Kokonut UI (shadcn/ui + Motion) |

---

## 1. Brand Direction

Crumb & Confetti is a fictional cafe & bakery brand created as the flagship demo of the TableCraft template. The direction is deliberately **not** minimalist — it's warm, energetic, and a little silly, like the bakery itself is having fun. Hand-drawn doodle illustrations (croissants, coffee cups, confetti bursts, sprinkle trails) act as recurring motifs across section dividers and empty states, rather than stock photography alone.

This is intentionally the opposite pole from Yatin's usual Korean-minimalist personal aesthetic — proof the template system isn't locked to one visual language and can flex per client brand.

## 2. Design Tokens

### Color

| Token | Value | Usage |
|---|---|---|
| `color-primary` | `#FF6B4A` (tangerine coral) | Primary CTAs, active nav state, key accents |
| `color-secondary` | `#FFC93C` (butter yellow) | Secondary buttons, highlight badges, hover backgrounds |
| `color-accent` | `#F23D6E` (berry pink) | High-emphasis accents — confirmation states, illustrated confetti |
| `color-accent-2` | `#2EC4B6` (mint teal) | Sparingly, for contrast pops and success indicators |
| `color-neutral-900` | `#2B2118` (espresso brown-black) | Primary text |
| `color-neutral-100` | `#FFF8F0` (warm cream) | Page background |
| `color-surface` | `#FFFFFF` | Card backgrounds |
| `color-success` | `#2EC4B6` | Booking confirmed states |
| `color-error` | `#E63946` | Form errors, fully-booked states |

**Contrast rule:** every color pairing used for text must be verified at WCAG AA (4.5:1 for body text, 3:1 for large text/UI). Coral and yellow are vibrant but lower-contrast against white — always pair CTA text in white or `color-neutral-900`, checked per-combination, never assumed.

### Typography

| Token | Font | Usage |
|---|---|---|
| `font-display` | Fredoka (rounded, bold, playful geometric) | H1/H2 headings, hero copy |
| `font-body` | Plus Jakarta Sans | Body copy, menu descriptions, forms |
| `font-heading-lg` | Fredoka SemiBold, 40–56px | Page/hero titles |
| `font-heading-md` | Fredoka SemiBold, 24–32px | Section titles |
| `font-body-md` | Plus Jakarta Sans Regular, 16px | Paragraphs, menu item descriptions |
| `font-body-sm` | Plus Jakarta Sans Regular, 14px | Meta text, timestamps, captions |

### Spacing & Shape

| Token | Value | Usage |
|---|---|---|
| `spacing-xs` … `spacing-2xl` | 4 / 8 / 16 / 24 / 32 / 48 / 64px | Standard Tailwind-aligned spacing scale |
| `radius-md` | 12px | Inputs, small cards |
| `radius-lg` | 20px | Menu/gallery cards |
| `radius-full` | 999px | Pills, badges, avatar/testimonial photos |
| `shadow-soft` | Soft, warm-tinted (coral at low opacity) drop shadow | Cards, CTA buttons — reinforces the playful, tactile feel |

## 3. Key Screens

### Public Site
1. **Home** — hero (illustrated, animated), featured menu teaser, live "book a table" widget, testimonials strip, footer
2. **Menu** — category tabs, item cards with image/description/price/dietary tags, featured-item highlight
3. **Gallery** — masonry/grid, lightbox on click
4. **Blog / Events / Specials** — listing (cards) + detail page; event posts show a date badge
5. **About / Story** — brand story, illustrated timeline optional
6. **Testimonials** — dedicated page or prominent home section
7. **Contact** — map embed, hours, phone/email, social links
8. **Reservation flow** — date → time → party size → (auto-assigned table) → guest details → instant confirmation
9. **Manage Reservation** — accessed via secure emailed link; view/cancel/reschedule
10. **Account** — sign up / log in (magic link, email+password, or "Continue with Google"), booking history once signed in
11. **Verify Email** — shown after email+password sign-up, pending the confirmation-link click; resend option (rate-limited)
12. **Forgot / Reset Password** — request screen (email input) + set-new-password screen reached via the emailed reset link (email+password accounts only)
13. **Privacy Policy** — static legal page
14. **Terms of Use** — static legal page
15. **Cookie Consent Banner** — first-visit overlay, accept/customize non-essential cookies

### Admin CMS
16. Admin login — same three methods as customer Account, gated behind `is_admin()` post-auth
17. Dashboard — Bklit UI charts: reservation volume, busiest days/times, top menu items
18. Menu manager
19. Gallery manager
20. Reservations & floor manager (live-updating via Realtime)
21. Blog/Events manager
22. Hours & holiday closures manager
23. Testimonials manager
24. Settings (brand info, contact details, currency/timezone)

## 4. Components

| Component | Variant | Notes |
|---|---|---|
| Button | Primary / Secondary / Ghost | Primary = coral fill, white text; hover = slight scale + shadow bloom |
| Card | Menu item / Gallery / Blog / Testimonial | `radius-lg`, `shadow-soft` |
| Date/Time Picker | Availability-aware | Unavailable dates/times visually distinct (see States below) |
| Stepper | Reservation flow | Horizontal on desktop, full-screen single-step on mobile |
| Badge | Dietary tag / Event date / Featured | `radius-full`, secondary/accent colors |
| Toast | Success / Error | Confetti micro-burst (anime.js) on booking success toast specifically |
| Nav | Public / Admin sidebar | Public: sticky top nav, collapses to hamburger under 768px; Admin: persistent sidebar, collapses to icon-only on tablet |
| Icon Button | Admin row actions (edit/delete/cancel/no-show/complete/reorder), collapsed nav | No icon-only control ships without a visible text label or, where space is genuinely tight (collapsed admin sidebar, table row actions), a text `Tooltip` on hover/focus plus an `aria-label` — icon alone is never the only identifier |
| Tooltip | Icon-button label / helper hint | Appears on hover and on keyboard focus (not hover-only), short plain-text content, respects the same contrast rules as body text |
| OAuth Button | "Continue with Google" | Uses Google's official branding/lockup per their guidelines (not restyled in `color-primary`); sits alongside, not replacing, the magic-link/password fields |
| Cookie Consent Banner | First-visit / Preferences | Plain-text explanation, "Accept" + "Manage preferences" actions, dismissible only via an explicit choice — no dark-pattern auto-dismiss |

## 5. States & Interactions

| Element | State | Behavior |
|---|---|---|
| Reservation date cell | Available | Default styling, clickable |
| Reservation date cell | Limited availability | Secondary-color dot indicator |
| Reservation date cell | Fully booked / closed | Muted/disabled, not clickable, tooltip explains why |
| Book CTA | Loading | Spinner replaces label (label text preserved for screen readers via `aria-label`, not removed), button disabled |
| Book CTA | Success | **Optimistic**: confirmation screen renders as soon as `book_reservation` resolves, without waiting on the email send — confetti burst animation + success toast + redirect to confirmation screen |
| Book CTA | Optimistic rollback (race condition) | If the slot was taken in the milliseconds before submit, the optimistic confirmation reverts to the availability screen with a clear "that slot was just taken" inline message, not a silent failure |
| Form field | Error | Error-color border, inline message below field |
| Admin table row (reservation) | New (via Realtime) | Brief highlight flash, then settles to normal row style |
| Admin table row (reservation) | Manual action (cancel/no-show/complete) | **Optimistic**: row updates immediately on click; reconciled against the Realtime event; on failure, the row reverts and shows an inline error, action button/tooltip re-enabled |
| Sign-up (email+password) | Awaiting verification | Clear text state: "Check your email to verify your account" — not a dead-end screen, includes a rate-limited "resend" link |
| Password reset | Link expired/used | Explicit error message + a way to request a new reset link, never a silent failure |
| Google OAuth button | Loading / Error | Loading spinner on the button itself while the redirect completes; error state surfaces a plain-text retry message if the OAuth flow is cancelled/fails |
| Cookie consent banner | First visit | Visible until an explicit Accept/Manage-preferences choice is made; does not block page content behind it |
| Rate-limited action (auth resend, magic link, reset request) | Limit hit | Plain-text "please wait Xs before trying again" rather than a generic error — the person should understand why, not just that it failed |

## 6. Responsive Behavior

| Breakpoint | Changes |
|---|---|
| Desktop (>1024px) | Full nav, multi-column menu/gallery grids, side-by-side reservation stepper |
| Tablet (768–1024px) | 2-column grids, condensed nav, admin sidebar icon-only |
| Mobile (<768px) | Single column, hamburger nav, reservation flow becomes full-screen single-step-at-a-time |

## 7. Animation / Motion

| Element | Trigger | Library | Description |
|---|---|---|---|
| Hero illustration | Page load | Motion | Staggered fade/slide-in of illustrated elements |
| Menu/gallery cards | Scroll into view | Motion | Fade + slide-up reveal, staggered |
| Confetti burst | Booking confirmed | anime.js | Small particle burst around the confirmation checkmark — the signature "moment of delight" |
| Button hover | Hover | anime.js | Slight bounce/scale, shadow bloom |
| Page transitions | Route change | Motion | Fade/slide, kept under 300ms to stay snappy |
| Nav underline | Hover/active | Motion | Sliding underline indicator |

## 8. Accessibility Notes

- All color/text pairings verified against WCAG AA contrast, with the vibrant palette double-checked (coral/yellow are the riskiest combinations)
- Visible focus rings on every interactive element (not suppressed for aesthetics)
- Reservation date/time picker fully keyboard-navigable, with ARIA live region announcing availability changes
- All gallery/menu images require alt text — the admin CMS prompts for it on upload rather than allowing it to be skipped
- Motion respects `prefers-reduced-motion` — confetti and scroll reveals are disabled/simplified for users who request reduced motion
- Every icon-only control (admin row actions, collapsed nav, table/gallery reorder handles) carries a visible text label or an `aria-label` plus an on-hover/on-focus tooltip — this is enforced as a design-review checklist item in Phase 4, not left to per-component discretion
