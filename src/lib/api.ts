import { supabase, isSupabaseConfigured } from "./supabase";
import {
  type BlogPost,
  type BusinessHours,
  type GalleryImage,
  type MenuCategory,
  type MenuItem,
  type SiteSettings,
  type Testimonial,
  mockSiteSettings,
  mockMenuCategories,
  mockMenuItems,
  mockGalleryImages,
  mockBlogPosts,
  mockTestimonials,
  mockBusinessHours,
} from "./content";
import {
  type BookingPayload,
  type BookingResult,
  type ReservationConfig,
  mockReservationConfig,
  mockAvailableTimes,
  mockMonthAvailability,
  mockBookReservation,
} from "./booking";

/**
 * Public-site data access layer (TRD §5).
 *
 * When Supabase is configured, reads go through supabase-js (RLS limits
 * public reads to published/active rows). When it is not yet configured
 * (no .env), we fall back to the rich mock data so the site remains fully
 * browsable — the swap is transparent to the pages.
 */

const MOCK_DELAY_MS = 250;

async function mock<T>(data: T): Promise<T> {
  // Small delay so loading states are exercised even in mock mode.
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return data;
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured) return mock(mockSiteSettings);
  const { data } = await supabase!.from("site_settings").select("*").limit(1).maybeSingle();
  return (data as SiteSettings | null) ?? mockSiteSettings;
}

export async function fetchMenu(): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> {
  if (!isSupabaseConfigured) {
    return mock({ categories: mockMenuCategories, items: mockMenuItems });
  }
  const [catRes, itemRes] = await Promise.all([
    supabase!.from("menu_categories").select("*").order("display_order"),
    supabase!.from("menu_items").select("*").order("display_order"),
  ]);
  return {
    categories: (catRes.data as MenuCategory[] | null) ?? [],
    items: (itemRes.data as MenuItem[] | null) ?? [],
  };
}

export async function fetchGallery(): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured) return mock(mockGalleryImages);
  const { data } = await supabase!.from("gallery_images").select("*").order("display_order");
  return (data as GalleryImage[] | null) ?? [];
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return mock(mockBlogPosts);
  const { data } = await supabase!
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return (data as BlogPost[] | null) ?? [];
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return mock(mockTestimonials);
  const { data } = await supabase!
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("display_order");
  return (data as Testimonial[] | null) ?? [];
}

export async function fetchBusinessHours(): Promise<BusinessHours[]> {
  if (!isSupabaseConfigured) return mock(mockBusinessHours);
  const { data } = await supabase!.from("business_hours").select("*").order("day_of_week");
  return (data as BusinessHours[] | null) ?? [];
}

/* ── Phase 2: Reservation engine ───────────────────────────────────── */

/** Booking config (slot length, window, notice, max party). */
export async function fetchReservationConfig(): Promise<ReservationConfig> {
  if (!isSupabaseConfigured) return mock(mockReservationConfig);
  const { data, error } = await rpc!("get_reservation_config");
  if (error) throw error;
  return (data as ReservationConfig | null) ?? mockReservationConfig;
}

// supabase-js's generic rpc() fails to resolve `Args` for object args under
// this TS setup (falls back to `undefined`), so we cast to the plain
// signature we actually use. Payload shapes are still enforced by the
// BookingPayload type and validated by the DB functions themselves.
// NOTE: guarded — `supabase` is null in mock mode, so this must not throw
// at module load (the casts below run only after isSupabaseConfigured).
type RpcFn = (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: unknown; error: { code: string; message: string } | null }>;

// NOTE: `rpc` is a class method that reads `this.postgrest`, so it must be
// bound before extraction or it loses `this` the moment Supabase is configured.
const rpc: RpcFn | null = supabase ? (supabase.rpc.bind(supabase) as unknown as RpcFn) : null;

/** Available slot start times (UTC ISO strings) for a date + party. */
export async function fetchAvailableTimes(date: string, partySize: number): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return mock(mockAvailableTimes(date, partySize, mockBusinessHours, mockReservationConfig));
  }
  const { data, error } = await rpc!("get_available_times", { p_date: date, p_party_size: partySize });
  if (error) throw error;
  return (data as string[] | null) ?? [];
}

/** Per-day availability counts for a calendar month. */
export async function fetchMonthAvailability(
  monthStart: string,
  partySize: number
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) {
    return mock(mockMonthAvailability(monthStart, partySize, mockBusinessHours, mockReservationConfig));
  }
  const { data, error } = await rpc!("get_month_availability", {
    p_month_start: monthStart,
    p_party_size: partySize,
  });
  if (error) throw error;
  return (data as Record<string, number> | null) ?? {};
}

/**
 * Create a reservation via the atomic book_reservation() RPC.
 * The RPC raises errcode 'RACED' when the exclusion constraint fires —
 * we surface that as `raced: true` so the UI can roll back to a fresh
 * availability screen (optimistic-ui contract, TRD §3.3).
 */
export async function bookReservation(payload: BookingPayload): Promise<BookingResult> {
  if (!isSupabaseConfigured) return mockBookReservation(payload, mockReservationConfig);
  const { data, error } = await rpc!("book_reservation", {
    p_guest_name: payload.guestName,
    p_guest_email: payload.guestEmail,
    p_guest_phone: payload.guestPhone,
    p_party_size: payload.partySize,
    p_start_time: payload.startTime,
    p_special_requests: payload.specialRequests ?? null,
    p_section: payload.section ?? null,
  });
  if (error) {
    const raced = error.code === "RACED" || error.message.includes("just taken");
    return { ok: false, raced, error: error.message };
  }
  const d = data as {
    ok: boolean;
    id?: string;
    table_id?: string;
    confirmation_code?: string;
    start_time?: string;
    end_time?: string;
  } | null;
  if (!d?.ok) return { ok: false, error: "Booking failed — please try again." };
  return {
    ok: true,
    id: d.id,
    tableId: d.table_id,
    confirmationCode: d.confirmation_code,
    startTime: d.start_time,
    endTime: d.end_time,
  };
}
