/**
 * Admin authentication (Phase 3).
 *
 * Two modes, decided by whether Supabase credentials are present:
 *
 *  - Supabase mode: sign-in via supabase-js (email/password). The session
 *    is persisted by the Supabase client itself, and the user must be
 *    provisioned in the public.admins table (RLS + is_admin() gate it).
 *    Signing in with an account that isn't in `admins` signs the user
 *    right back out and throws a clear error.
 *
 *  - Demo mode (no .env): a one-tap "explore the demo" flag in
 *    localStorage so the full CMS is browsable without credentials.
 */
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AdminAuthStatus = "loading" | "authed" | "anon";

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  role: "owner" | "staff" | "demo";
}

interface AdminAuthState {
  status: AdminAuthStatus;
  user: AdminUser | null;
  /** Resolve the current session on app load (idempotent). */
  init: () => Promise<void>;
  /** Supabase email/password sign-in. Throws with a user-readable message. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Demo mode — no credentials required. */
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEMO_KEY = "crumb-confetti-admin-demo";

let initStarted = false;

/** After a successful Supabase auth, verify the user is an admin. */
async function resolveAdminUser(user: { id: string; email?: string }): Promise<void> {
  // get_admin_profile() is a security-definer RPC (migration 0003) so the
  // check works even though public.admins is locked down under RLS.
  const { data, error } = (await supabase!.rpc("get_admin_profile")) as unknown as {
    data: { full_name: string | null; role: string | null } | null;
    error: { message: string } | null;
  };
  const adminRow = data;

  if (error || !adminRow) {
    // Revoke the session so a non-admin never lingers as "signed in".
    await supabase!.auth.signOut();
    useAdminAuth.setState({ status: "anon", user: null });
    throw new Error(
      "This account doesn't have admin access. Ask the site owner to add you to the admins table."
    );
  }

  useAdminAuth.setState({
    status: "authed",
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: adminRow.full_name ?? undefined,
      role: adminRow.role === "staff" ? "staff" : "owner",
    },
  });
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  status: "loading",
  user: null,

  init: async () => {
    if (initStarted) return;
    initStarted = true;

    // Demo mode — a localStorage flag is the whole session.
    if (!isSupabaseConfigured) {
      const demo = localStorage.getItem(DEMO_KEY) === "1";
      set(
        demo
          ? {
              status: "authed",
              user: { id: "demo", email: "demo@crumbandconfetti.local", role: "demo" },
            }
          : { status: "anon", user: null }
      );
      return;
    }

    try {
      const { data } = await supabase!.auth.getSession();
      if (!data.session) {
        set({ status: "anon", user: null });
        return;
      }
      await resolveAdminUser(data.session.user);
    } catch {
      // Session exists but the user isn't an admin (e.g. removed since) —
      // treat as signed out rather than erroring on every page load.
      set({ status: "anon", user: null });
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase isn't configured — use demo mode instead.");
    }
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await resolveAdminUser(data.user);
  },

  signInDemo: async () => {
    localStorage.setItem(DEMO_KEY, "1");
    set({
      status: "authed",
      user: { id: "demo", email: "demo@crumbandconfetti.local", role: "demo" },
    });
  },

  signOut: async () => {
    localStorage.removeItem(DEMO_KEY);
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
    set({ status: "anon", user: null });
  },
}));
