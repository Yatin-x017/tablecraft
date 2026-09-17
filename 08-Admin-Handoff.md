# TableCraft — Admin Provisioning & Handoff

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | August 17, 2026 |
| Applies to | `public.admins` (migration `0001`), `get_admin_profile()` (migration `0003`) |

---

## 1. Why this document exists (the chicken-and-egg)

The `admins` table is locked down under RLS:

```sql
-- migration 0001
create policy "admins admin all" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());
```

`is_admin()` is `true` only when the caller already has a row in `admins` — so **no one can insert the first admin row through the normal (anon-key) API**. That is deliberate: admin grants are provisioned manually during handoff, never self-service.

The login page (route `/admin/login`) works around the read side with a security-definer RPC — `get_admin_profile()` (migration `0003`) returns the *caller's own* row without tripping RLS — and signs the user back out with *"This account doesn't have admin access"* if no row exists. **Therefore: the only requirement for someone to sign in as admin is a row in `public.admins` pointing at their `auth.users.id`.**

## 2. Prerequisites

1. A Supabase project with migrations `0001`–`0004` applied.
2. The future admin's auth account exists in the project (sign-up via email/password, magic link, or Google OAuth — all three resolve to the same `auth.users.id`, so provisioning is identical).
3. Their `auth.users.id`. Get it from **Dashboard → Authentication → Users** (copy the UUID), or:

```sql
select id, email from auth.users;
```

## 3. Provisioning the first admin

Any of the three options below works; the dashboard SQL editor is the recommended path because it runs as the service role and needs no keys on your machine.

### Option A — Dashboard → SQL Editor (recommended)

```sql
insert into public.admins (id, full_name, role)
values ('<auth.users.id>', 'Yatin', 'owner');
```

Replace `<auth.users.id>` with the UUID from §2. Verify:

```sql
select * from public.admins;
```

### Option B — Service-role key (scripted / one-off)

The service-role key bypasses RLS. **Never ship this key to the client** — use it from a trusted script or CI only.

```bash
curl -X POST "$SUPABASE_URL/rest/v1/admins" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"id":"<auth.users.id>","full_name":"Yatin","role":"owner"}'
```

Or with supabase-js:

```ts
import { createClient } from "@supabase/supabase-js";
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
await admin.from("admins").insert({ id: "<auth.users.id>", full_name: "Yatin", role: "owner" });
```

### Option C — Local validation cluster (repo-only, not production)

For the throwaway `.pgdata/` cluster used to validate migrations, RLS is bypassed for the `postgres` superuser, so any insert works:

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -h .pgdata -p 54329 -U postgres -d postgres \
  -c "insert into public.admins (id, full_name, role) values ('<uuid>', 'Dev Admin', 'owner');"
```

## 4. Verifying the handoff

1. Open **`/admin/login`** (e.g. `https://<project>.vercel.app/admin/login`) and sign in with the admin's credentials.
2. Success = landing on the dashboard. Failure with *"This account doesn't have admin access"* means the `admins` row is missing or the `id` doesn't match `auth.users.id`.
3. Sanity check the session's own row (works because the RPC is security-definer — callable even though `admins` is RLS-locked):

```sql
select * from public.get_admin_profile();
```

> Note: the SQL Editor runs as the service role with no JWT, so `auth.uid()` is NULL there and `get_admin_profile()` returns nothing. Use a real browser session (step 2) as the authoritative check, or just `select * from public.admins;` in the editor.

## 5. Adding more admins later

Once the first admin exists, the `admins admin all` policy lets **any existing admin** (or the service role / dashboard) insert new rows — including `staff`:

```sql
insert into public.admins (id, full_name, role)
select id, 'Staff Name', 'staff'
from auth.users
where email = 'staff@example.com';
```

- `role` is `'owner' | 'staff'` (check constraint in migration `0001`). Staff-scoped permissions are planned (P2) — today both roles get the full CMS.
- There is no admin-management UI yet; add rows via SQL/dashboard or the service-role API as above.

## 6. Security notes

- The chicken-and-egg is intentional: **there is no self-service path to admin**. Anyone who needs access must be provisioned by you (or another admin) against a real auth account.
- Keep the service-role key server-side; it bypasses RLS on every table.
- Removing access = deleting the row: `delete from public.admins where id = '<auth.users.id>';` — the session is revoked on their next page load (`init()` resolves and signs them out).
