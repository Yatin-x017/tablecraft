import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/lib/adminAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePageMeta } from "@/lib/seo";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/PageStates";

/** Standalone staff login — rendered outside AdminLayout so it never needs a session. */
export function LoginPage() {
  usePageMeta("Staff Login", "Sign in to the Crumb & Confetti admin CMS.");
  const { status, signIn, signInDemo } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve an existing session (direct visit, refreshed tab, etc.).
  useEffect(() => {
    void useAdminAuth.getState().init();
  }, []);

  if (status === "authed") return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // status flips to "authed" → the <Navigate> above takes over.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  async function handleDemo() {
    setBusy(true);
    setError(null);
    try {
      await signInDemo();
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-cream">
        <LoadingState label="Checking the kitchen pass" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-cream px-margin-mobile py-16 md:px-margin-desktop">
      <div aria-hidden="true" className="doodle-bg-dots pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="absolute left-8 top-10 -rotate-12 text-on-surface opacity-40">
        <Icon name="star" size="xl" />
      </div>
      <div aria-hidden="true" className="absolute bottom-16 right-12 rotate-45 text-on-surface opacity-40">
        <Icon name="auto_awesome" size="lg" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <Link
          to="/"
          className="mb-8 flex flex-col items-center gap-1 text-center"
          aria-label="Back to Crumb and Confetti"
        >
          <Icon name="cake" size="xl" className="text-primary" />
          <span className="font-headline-md text-headline-md font-bold leading-none tracking-tight text-on-surface">
            CRUMB &amp; CONFETTI
          </span>
          <span className="font-label-bold text-label-bold uppercase tracking-widest text-primary">
            Admin CMS
          </span>
        </Link>

        <div className="rounded-[32px] radical-border radical-shadow bg-surface-white p-8 md:p-10">
          <h1 className="font-headline-lg text-headline-lg uppercase leading-none text-on-surface">
            Staff Login
          </h1>
          <p className="mt-2 font-body-md text-on-surface-variant">
            Sign in to manage the menu, reservations, and the bakehouse.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border-2 border-on-surface bg-error-container p-4 font-body-sm text-on-error-container"
            >
              <Icon name="error" size="sm" className="mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chef@crumbandconfetti.com"
              icon="mail"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon="lock"
              required
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              {!busy && <Icon name="arrow_forward" size="sm" />}
            </Button>
          </form>

          {!isSupabaseConfigured && (
            <div className="mt-8 border-t-2 border-dashed border-outline-variant pt-6">
              <p className="mb-1 font-label-bold text-label-bold uppercase text-on-surface-variant">
                No backend connected yet
              </p>
              <p className="mb-4 font-body-sm text-on-surface-variant">
                Supabase isn't configured, so the CMS runs on the built-in demo data. Add{" "}
                <code className="rounded bg-surface-container px-1.5 py-0.5 text-[12px]">VITE_SUPABASE_URL</code>{" "}
                and <code className="rounded bg-surface-container px-1.5 py-0.5 text-[12px]">VITE_SUPABASE_ANON_KEY</code>{" "}
                to a <code className="rounded bg-surface-container px-1.5 py-0.5 text-[12px]">.env</code> file to go live.
              </p>
              <Button variant="secondary" size="lg" className="w-full" onClick={handleDemo} disabled={busy}>
                <Icon name="auto_awesome" size="sm" /> Explore the demo
              </Button>
            </div>
          )}

          {isSupabaseConfigured && (
            <p className="mt-6 border-t-2 border-dashed border-outline-variant pt-5 font-body-sm text-on-surface-variant">
              Only accounts provisioned in the <strong className="text-on-surface">admins</strong> table can
              sign in. Contact the site owner if you don't have access.
            </p>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-bold text-label-bold uppercase text-on-surface transition-colors hover:text-primary"
          >
            <Icon name="arrow_back" size="sm" /> Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}
