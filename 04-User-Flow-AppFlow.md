# TableCraft — User Flow / App Flow

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | July 23, 2026 |

This document maps every primary journey through the app. Diagrams use Mermaid (renders natively on GitHub, Notion, and most markdown viewers).

---

## 1. Guest Reservation Flow (Primary Flow — Guest Booking)

**Narrative:**
1. Guest lands on the site (direct, search, or social) and browses Menu / Gallery / About
2. Guest clicks **Book a Table**
3. Guest selects a date and party size
4. The system queries real-time availability and shows only bookable time slots (closed hours, holidays, and fully-booked slots are simply never shown — no dead ends)
5. Guest selects a time
6. Guest enters name, email, and phone (no account required)
7. Guest is offered the option to save these details as a lightweight account (magic-link, no password) for faster rebooking later
8. On submit, the `book_reservation` function runs (`await`ed) as a single atomic database transaction, re-validating availability and auto-assigning the best-fit table
9. If the slot is still free: reservation confirms **instantly** — no owner approval step. The confirmation screen renders **optimistically** the moment the RPC resolves, without waiting on the email to send
10. Guest sees an on-screen confirmation (with the signature confetti micro-animation, clear text labels throughout — not icon-only) and a confirmation email is fired asynchronously via EmailJS (trial email provider) with a self-service cancel/reschedule link
11. If, in the rare case, someone else grabbed the last table in the milliseconds between step 4 and step 8, the optimistic confirmation is rolled back and the guest is shown an updated set of available times instead of a broken confirmation

```mermaid
flowchart TD
    A[Land on site] --> B[Browse Menu / Gallery / About]
    B --> C[Click Book a Table]
    C --> D[Select date + party size]
    D --> E[System shows real-time available times only]
    E --> F{Any slots available?}
    F -- No --> D
    F -- Yes --> G[Select a time]
    G --> H[Enter name, email, phone]
    H --> I{Save as account?}
    I -- Yes --> J[Magic-link account created]
    I -- No --> K[Continue as guest]
    J --> L[Submit reservation]
    K --> L
    L --> M[book_reservation runs atomically in Postgres, awaited]
    M --> N{Slot still free?}
    N -- No, race condition --> E
    N -- Yes --> O[Optimistic confirmation renders instantly]
    O --> P[On-screen confirmation + confetti animation]
    O --> Q[Confirmation email sent async via EmailJS - trial]
    Q --> R[Email includes self-service cancel/reschedule link]
```

## 2. Returning Customer Flow

**Narrative:** A guest who previously saved an account can log back in via any of the three methods (magic link, email+password, or Google OAuth) to see upcoming and past reservations, cancel/reschedule, or rebook the same details in one tap.

```mermaid
flowchart TD
    A[Click My Bookings] --> B{Choose sign-in method}
    B -- Magic link --> C1[Enter email] --> C2[Magic link sent] --> C3[Click link -> logged in]
    B -- Email + password --> D1[Enter email + password] --> D2{Verified?}
    D2 -- No --> D3[Prompted to verify email first]
    D2 -- Yes --> C3
    B -- Google --> E1[Continue with Google] --> E2[Google consent screen] --> C3
    C3 --> F[View upcoming reservations]
    C3 --> G[View past reservations]
    F --> H[Cancel / reschedule]
    G --> I[Rebook same details - one tap]
```

## 2a. Sign-Up, Email Verification & Forgot Password Flow

**Narrative:** Covers the email+password path specifically, since it's the only one of the three methods with its own verification and reset steps — magic link and Google are self-verifying by construction (§4 Edge Cases).

```mermaid
flowchart TD
    A[Sign up with email + password] --> B[Account created, unconfirmed]
    B --> C[Verification email sent]
    C --> D{Click verification link?}
    D -- Not yet --> E[Can browse as guest, cannot log in to this account]
    E --> F[Resend verification - rate-limited]
    F --> C
    D -- Yes --> G[Account confirmed, can log in]
    G --> H[Forgot password?]
    H --> I[Enter email]
    I --> J[Reset link emailed - rate-limited]
    J --> K[Click link]
    K --> L[Set new password]
    L --> G
```

## 3. Admin Flow

**Narrative:** The owner logs into a separate admin area. The dashboard gives an at-a-glance analytics view, and every content type (menu, gallery, blog/events, testimonials, hours) is independently manageable. Every list view (reservations, gallery, blog/events, testimonials) loads in paginated pages rather than the whole table at once, and every row action (edit, delete, cancel, no-show, complete) is a labeled control, not a bare icon, with a tooltip for the ones that stay icon-first for space. The reservations screen updates live as bookings come in, thanks to Supabase Realtime, and manual actions (cancel/no-show/complete/phone-in booking) reflect on screen optimistically, then reconcile against the Realtime event.

```mermaid
flowchart TD
    A[Admin login - magic link, email+password, or Google] --> A1{Has admins row?}
    A1 -- No --> A2[Authenticated but not admin - no access]
    A1 -- Yes --> B[Dashboard: analytics overview]
    B --> C[Reservations and Floor Manager]
    B --> D[Menu Manager]
    B --> E[Gallery Manager]
    B --> F[Blog / Events Manager]
    B --> G[Hours and Holiday Manager]
    B --> H[Testimonials Manager]
    C --> C1[Bookings update live via Realtime]
    C --> C2[Manually add a phone-in booking - optimistic]
    C --> C3[Cancel / mark no-show / mark completed - optimistic, reconciled by Realtime]
    G --> G1[Block a holiday date]
    G1 --> G2[Booking engine stops offering that date automatically]
```

## 4. Edge Cases

| Scenario | System behavior |
|---|---|
| Slot outside business hours | Never shown as an option in the first place |
| Date is a blocked holiday | Never shown as an option in the first place |
| Party size exceeds the largest available table | Booking form shows: "For parties over [max size], please contact us directly" with phone/email |
| Two guests race for the last table at the same instant | Database exclusion constraint guarantees only one insert succeeds; the second guest sees a refreshed (now-unavailable) slot list, never a false confirmation |
| Guest cancels via email link | Table is released back into the availability pool immediately; admin's live reservations view updates in real time |
| Guest lets a magic-link email sit unused | Link expires per Supabase Auth defaults; guest can request a new one |
| Email+password account not yet verified | Can't log in to that account (guest booking still works); prompted to verify, with a rate-limited resend option |
| Someone authenticates (any method, including Google) but has no `admins` row | Treated as a regular authenticated user, not an admin — no admin routes are reachable |
| Repeated magic-link / verification / password-reset requests | Rate-limited per email/IP; person sees a plain-text "try again in a moment" rather than a silent block |
| Visitor declines non-essential cookies | Site remains fully usable (booking flow doesn't depend on non-essential cookies); only analytics/embeds that need consent are withheld |

```mermaid
flowchart TD
    A[Guest attempts to book] --> B{Within business hours?}
    B -- No --> C[Slot not shown]
    A --> D{Date is a holiday closure?}
    D -- Yes --> C
    A --> E{Party size exceeds max table capacity?}
    E -- Yes --> F["Show: contact us directly for large parties"]
    A --> G{Simultaneous booking race for same table?}
    G -- Yes --> H[DB exclusion constraint rejects the second insert]
    H --> I["Guest sees: slot just booked, choose another"]
```
