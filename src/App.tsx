import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CookieConsent } from "@/components/CookieConsent";
import { PageFallback } from "@/components/PageStates";
import { PageTransition } from "@/components/motion/PageTransition";
import { privacySections, termsSections } from "@/lib/legal";

/**
 * Route-based code splitting (TRD §9): every page is lazy-loaded so the
 * public bundle never ships admin code and vice-versa. The layout shells
 * stay eager (they render the Suspense fallback while a page chunk loads).
 */

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const MenuPage = lazy(() => import("@/pages/MenuPage").then((m) => ({ default: m.MenuPage })));
const GalleryPage = lazy(() => import("@/pages/GalleryPage").then((m) => ({ default: m.GalleryPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const EventsPage = lazy(() => import("@/pages/EventsPage").then((m) => ({ default: m.EventsPage })));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage").then((m) => ({ default: m.BlogPostPage })));
const LegalPage = lazy(() => import("@/pages/LegalPage").then((m) => ({ default: m.LegalPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const AdminNotFoundPage = lazy(() => import("@/pages/admin/AdminNotFoundPage").then((m) => ({ default: m.AdminNotFoundPage })));
const CateringPage = lazy(() => import("@/pages/CateringPage").then((m) => ({ default: m.CateringPage })));
const BookingPage = lazy(() => import("@/pages/BookingPage").then((m) => ({ default: m.BookingPage })));

const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const MenuManagerPage = lazy(() => import("@/pages/admin/MenuManagerPage").then((m) => ({ default: m.MenuManagerPage })));
const ReservationsPage = lazy(() => import("@/pages/admin/ReservationsPage").then((m) => ({ default: m.ReservationsPage })));
const FloorSetupPage = lazy(() => import("@/pages/admin/FloorSetupPage").then((m) => ({ default: m.FloorSetupPage })));
const GalleryManagerPage = lazy(() => import("@/pages/admin/GalleryManagerPage").then((m) => ({ default: m.GalleryManagerPage })));
const BlogManagerPage = lazy(() => import("@/pages/admin/BlogManagerPage").then((m) => ({ default: m.BlogManagerPage })));
const HoursManagerPage = lazy(() => import("@/pages/admin/HoursManagerPage").then((m) => ({ default: m.HoursManagerPage })));
const TestimonialsManagerPage = lazy(() => import("@/pages/admin/TestimonialsManagerPage").then((m) => ({ default: m.TestimonialsManagerPage })));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import("@/pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })));


export function App() {
  return (
    <>
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:slug" element={<BlogPostPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="catering" element={<CateringPage />} />
          <Route
            path="privacy"
            element={<LegalPage title="Privacy Policy" updated="July 23, 2026" sections={privacySections} />}
          />
          <Route
            path="terms"
            element={<LegalPage title="Terms of Use" updated="July 23, 2026" sections={termsSections} />}
          />
        </Route>

        {/* Transactional flow — standalone shell (nav suppressed per booking mockup) */}
        <Route
          path="book"
          element={
            <PageTransition>
              <Suspense fallback={<PageFallback />}>
                <BookingPage />
              </Suspense>
            </PageTransition>
          }
        />

        {/* Admin CMS (Phase 3) — login lives OUTSIDE the gated layout */}
        <Route
          path="admin/login"
          element={
            <PageTransition>
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="menu" element={<MenuManagerPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="floor" element={<FloorSetupPage />} />
          <Route path="gallery" element={<GalleryManagerPage />} />
          <Route path="blog" element={<BlogManagerPage />} />
          <Route path="hours" element={<HoursManagerPage />} />
          <Route path="testimonials" element={<TestimonialsManagerPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Admin 404 — renders inside the gated admin shell */}
          <Route path="*" element={<AdminNotFoundPage />} />
        </Route>

        {/* Fallback — branded public 404 */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <CookieConsent />
    </>
  );
}
