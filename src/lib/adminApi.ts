/**
 * Admin CMS data layer — Supabase-backed CRUD for every Phase 3 table.
 *
 * Mirrors supabase/migrations/0001_initial_schema.sql + 0003 (admin
 * extensions). Only reachable when Supabase is configured (all callers
 * guard with isSupabaseConfigured); the demo store in useAdminStore.ts
 * keeps the app fully functional without credentials.
 *
 * Row shapes are mapped between the store's camelCase types and the
 * DB's snake_case columns at this boundary so the store and UI never
 * deal with column names.
 *
 * NOTE: the mutation helpers type their own payloads because the current
 * TypeScript compiler (tsgo) resolves supabase-js's conditional
 * insert/update signatures to `never`; reads use the raw builder and cast
 * results, exactly like lib/api.ts.
 */
import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type {
  BlogPost,
  BusinessHours,
  GalleryImage,
  MenuCategory,
  MenuItem,
  SiteSettings,
  Testimonial,
} from "./content";
import type {
  AdminReservation,
  HolidayClosure,
  ReservationStatus,
  RestaurantTable,
} from "@/store/useAdminStore";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

/* ── Mutation helpers (typed payloads, tsgo-safe) ─────────────────── */

type MutationResult = Promise<{ error: PostgrestError | null }>;

function insertInto<T extends TableName>(table: T, values: Tables[T]["Insert"]): MutationResult {
  const q = supabase!.from(table);
  return (q as unknown as { insert: (v: Tables[T]["Insert"]) => MutationResult }).insert(values);
}

function updateRow<T extends TableName>(table: T, id: string, values: Tables[T]["Update"]): MutationResult {
  const q = supabase!.from(table);
  return (q as unknown as {
    update: (v: Tables[T]["Update"]) => { eq: (c: string, v: string) => MutationResult };
  }).update(values).eq("id", id);
}

function deleteRow<T extends TableName>(table: T, id: string): MutationResult {
  const q = supabase!.from(table);
  return (q as unknown as {
    delete: () => { eq: (c: string, v: string) => MutationResult };
  }).delete().eq("id", id);
}

function upsertRow<T extends TableName>(
  table: T,
  values: Tables[T]["Insert"],
  onConflict: string
): MutationResult {
  const q = supabase!.from(table);
  return (q as unknown as {
    upsert: (v: Tables[T]["Insert"], o: { onConflict: string }) => MutationResult;
  }).upsert(values, { onConflict });
}

/** Settings insert also returns the new row id. */
async function insertSettings(patch: Partial<SiteSettings>): Promise<string | null> {
  const { data, error } = await (supabase!.from("site_settings") as unknown as {
    insert: (v: Tables["site_settings"]["Insert"]) => {
      select: (cols: string) => {
        single: () => Promise<{ data: { id: string } | null; error: PostgrestError | null }>;
      };
    };
  })
    .insert(patch)
    .select("id")
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

/* ── Row mappers (DB → store shape) ─────────────────────────────── */

function mapSettings(row: Tables["site_settings"]["Row"]): SiteSettings {
  return {
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    timezone: row.timezone,
    currency: row.currency,
    social_links: (row.social_links ?? {}) as SiteSettings["social_links"],
  };
}

function mapCategory(row: Tables["menu_categories"]["Row"]): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    display_order: row.display_order,
    is_active: row.is_active,
  };
}

function mapItem(row: Tables["menu_items"]["Row"]): MenuItem {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    image_url: row.image_url ?? "",
    dietary_tags: row.dietary_tags ?? [],
    is_featured: row.is_featured,
    is_available: row.is_available,
    display_order: row.display_order,
  };
}

function mapGallery(row: Tables["gallery_images"]["Row"]): GalleryImage {
  return {
    id: row.id,
    image_url: row.image_url,
    alt_text: row.alt_text,
    caption: row.caption ?? "",
    display_order: row.display_order,
    is_active: row.is_active,
  };
}

function mapPost(row: Tables["blog_posts"]["Row"]): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    cover_image_url: row.cover_image_url ?? "",
    post_type: row.post_type,
    event_date: row.event_date ?? null,
    is_published: row.is_published,
  };
}

function mapTestimonial(row: Tables["testimonials"]["Row"]): Testimonial {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_photo_url: row.customer_photo_url ?? null,
    rating: row.rating,
    quote: row.quote,
    is_approved: row.is_approved,
    is_featured: row.is_featured,
    display_order: row.display_order,
  };
}

function mapHours(row: Tables["business_hours"]["Row"]): BusinessHours {
  return {
    day_of_week: row.day_of_week,
    open_time: row.open_time,
    close_time: row.close_time,
    is_closed: row.is_closed,
  };
}

function mapHoliday(row: Tables["holiday_closures"]["Row"]): HolidayClosure {
  return {
    id: row.id,
    date: row.closure_date,
    reason: row.reason ?? "",
    isFullDay: row.is_full_day,
    closedFrom: row.closed_from ?? undefined,
    closedTo: row.closed_to ?? undefined,
  };
}

function mapTable(row: Tables["restaurant_tables"]["Row"]): RestaurantTable {
  return {
    id: row.id,
    tableNumber: row.table_number,
    section: row.section,
    capacity: row.capacity_max,
    isActive: row.is_active,
  };
}

/**
 * DB row → store shape for reservations. Exported so the realtime
 * subscription (useAdminStore) can map incoming channel payloads
 * through the same boundary as the initial hydrate.
 */
export function mapReservation(row: Tables["reservations"]["Row"]): AdminReservation {
  return {
    id: row.id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    partySize: row.party_size,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as ReservationStatus,
    confirmationCode: row.confirmation_code,
    note: row.special_requests ?? undefined,
    tableId: row.table_id ?? undefined,
  };
}

/* ── Full hydrate ────────────────────────────────────────────────── */

export interface AdminData {
  settings: SiteSettings | null;
  categories: MenuCategory[];
  items: MenuItem[];
  gallery: GalleryImage[];
  posts: BlogPost[];
  testimonials: Testimonial[];
  hours: BusinessHours[];
  holidays: HolidayClosure[];
  tables: RestaurantTable[];
  reservations: AdminReservation[];
}

/**
 * Load every admin table in one pass. Runs under RLS — the admin
 * "all" policies grant full read/write once the signed-in user is
 * provisioned in public.admins (see 0001_initial_schema.sql).
 */
export async function loadAdminData(): Promise<AdminData> {
  const client = supabase!;

  const [settingsRes, catsRes, itemsRes, galleryRes, postsRes, testsRes, hoursRes, holidaysRes, tablesRes, resvRes] =
    await Promise.all([
      client.from("site_settings").select("*").limit(1).maybeSingle(),
      client.from("menu_categories").select("*").order("display_order"),
      client.from("menu_items").select("*").order("display_order"),
      client.from("gallery_images").select("*").order("display_order"),
      client.from("blog_posts").select("*").order("published_at", { ascending: false }),
      client.from("testimonials").select("*").order("display_order"),
      client.from("business_hours").select("*").order("day_of_week"),
      client.from("holiday_closures").select("*").order("closure_date"),
      client.from("restaurant_tables").select("*").order("table_number"),
      client.from("reservations").select("*").order("start_time", { ascending: false }),
    ]);

  for (const [name, res] of [
    ["settings", settingsRes],
    ["categories", catsRes],
    ["items", itemsRes],
    ["gallery", galleryRes],
    ["posts", postsRes],
    ["testimonials", testsRes],
    ["hours", hoursRes],
    ["holidays", holidaysRes],
    ["tables", tablesRes],
    ["reservations", resvRes],
  ] as const) {
    if (res.error) throw new Error(`Failed to load ${name}: ${res.error.message}`);
  }

  settingsRowId = (settingsRes.data as Tables["site_settings"]["Row"] | null)?.id ?? null;

  return {
    settings: settingsRes.data ? mapSettings(settingsRes.data as Tables["site_settings"]["Row"]) : null,
    categories: (catsRes.data as Tables["menu_categories"]["Row"][] | null)?.map(mapCategory) ?? [],
    items: (itemsRes.data as Tables["menu_items"]["Row"][] | null)?.map(mapItem) ?? [],
    gallery: (galleryRes.data as Tables["gallery_images"]["Row"][] | null)?.map(mapGallery) ?? [],
    posts: (postsRes.data as Tables["blog_posts"]["Row"][] | null)?.map(mapPost) ?? [],
    testimonials: (testsRes.data as Tables["testimonials"]["Row"][] | null)?.map(mapTestimonial) ?? [],
    hours: (hoursRes.data as Tables["business_hours"]["Row"][] | null)?.map(mapHours) ?? [],
    holidays: (holidaysRes.data as Tables["holiday_closures"]["Row"][] | null)?.map(mapHoliday) ?? [],
    tables: (tablesRes.data as Tables["restaurant_tables"]["Row"][] | null)?.map(mapTable) ?? [],
    reservations: (resvRes.data as Tables["reservations"]["Row"][] | null)?.map(mapReservation) ?? [],
  };
}

/* ── site_settings (singleton) ───────────────────────────────────── */

/** Remembered settings row id so updates target the same row. */
let settingsRowId: string | null = null;

export async function persistSettings(patch: Partial<SiteSettings>): Promise<void> {
  if (settingsRowId) {
    const { error } = await updateRow("site_settings", settingsRowId, patch);
    if (error) throw error;
    return;
  }
  settingsRowId = await insertSettings(patch);
}

/* ── menu_categories ─────────────────────────────────────────────── */

export async function createCategory(draft: Omit<MenuCategory, "id">): Promise<void> {
  const { error } = await insertInto("menu_categories", draft);
  if (error) throw error;
}

export async function updateCategory(id: string, patch: Partial<MenuCategory>): Promise<void> {
  const { error } = await updateRow("menu_categories", id, patch);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await deleteRow("menu_categories", id);
  if (error) throw error;
}

/* ── menu_items ──────────────────────────────────────────────────── */

export async function createMenuItem(item: MenuItem): Promise<void> {
  const { error } = await insertInto("menu_items", {
    id: item.id,
    category_id: item.category_id,
    name: item.name,
    description: item.description || null,
    price: item.price,
    image_url: item.image_url || null,
    dietary_tags: item.dietary_tags,
    is_featured: item.is_featured,
    is_available: item.is_available,
    display_order: item.display_order,
  });
  if (error) throw error;
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<void> {
  const { error } = await updateRow("menu_items", id, patch);
  if (error) throw error;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await deleteRow("menu_items", id);
  if (error) throw error;
}

/* ── gallery_images ──────────────────────────────────────────────── */

export async function createGalleryImage(image: GalleryImage): Promise<void> {
  const { error } = await insertInto("gallery_images", {
    id: image.id,
    image_url: image.image_url,
    alt_text: image.alt_text,
    caption: image.caption || null,
    display_order: image.display_order,
    is_active: image.is_active,
  });
  if (error) throw error;
}

export async function updateGalleryImage(id: string, patch: Partial<GalleryImage>): Promise<void> {
  const { error } = await updateRow("gallery_images", id, patch);
  if (error) throw error;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const { error } = await deleteRow("gallery_images", id);
  if (error) throw error;
}

/* ── blog_posts ──────────────────────────────────────────────────── */

export async function createPost(post: BlogPost): Promise<void> {
  const { error } = await insertInto("blog_posts", {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || null,
    content: post.content || null,
    cover_image_url: post.cover_image_url || null,
    post_type: post.post_type,
    event_date: post.event_date || null,
    is_published: post.is_published,
    published_at: post.is_published ? new Date().toISOString() : null,
  });
  if (error) throw error;
}

export async function updatePost(id: string, patch: Partial<BlogPost>): Promise<void> {
  const { error } = await updateRow("blog_posts", id, patch);
  if (error) throw error;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await deleteRow("blog_posts", id);
  if (error) throw error;
}

/* ── testimonials ────────────────────────────────────────────────── */

export async function createTestimonial(t: Testimonial): Promise<void> {
  const { error } = await insertInto("testimonials", {
    id: t.id,
    customer_name: t.customer_name,
    customer_photo_url: t.customer_photo_url ?? null,
    rating: t.rating,
    quote: t.quote,
    is_approved: t.is_approved,
    is_featured: t.is_featured,
    display_order: t.display_order,
  });
  if (error) throw error;
}

export async function updateTestimonial(id: string, patch: Partial<Testimonial>): Promise<void> {
  const { error } = await updateRow("testimonials", id, patch);
  if (error) throw error;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await deleteRow("testimonials", id);
  if (error) throw error;
}

/* ── business_hours (keyed by day_of_week, no store-side id) ─────── */

export async function upsertBusinessHours(
  dayOfWeek: number,
  patch: Partial<BusinessHours>
): Promise<void> {
  const { error } = await upsertRow(
    "business_hours",
    { day_of_week: dayOfWeek, ...patch },
    "day_of_week"
  );
  if (error) throw error;
}

/* ── holiday_closures ────────────────────────────────────────────── */

export async function createHoliday(holiday: HolidayClosure): Promise<void> {
  const { error } = await insertInto("holiday_closures", {
    id: holiday.id,
    closure_date: holiday.date,
    reason: holiday.reason || null,
    is_full_day: holiday.isFullDay,
    closed_from: holiday.closedFrom ?? null,
    closed_to: holiday.closedTo ?? null,
  });
  if (error) throw error;
}

export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await deleteRow("holiday_closures", id);
  if (error) throw error;
}

/* ── restaurant_tables ───────────────────────────────────────────── */

export async function createTable(table: RestaurantTable): Promise<void> {
  const { error } = await insertInto("restaurant_tables", {
    id: table.id,
    table_number: table.tableNumber,
    section: table.section,
    capacity_min: 1,
    capacity_max: table.capacity,
    is_active: table.isActive,
  });
  if (error) throw error;
}

export async function updateTable(id: string, patch: Partial<RestaurantTable>): Promise<void> {
  const { error } = await updateRow("restaurant_tables", id, patch);
  if (error) throw error;
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await deleteRow("restaurant_tables", id);
  if (error) throw error;
}

/* ── reservations ────────────────────────────────────────────────── */

/**
 * Store statuses 'arrived'/'seated' are admin-lifecycle states; the DB
 * check constraint (extended in migration 0003) stores them as-is.
 */
const STATUS_TO_DB: Record<ReservationStatus, string> = {
  confirmed: "confirmed",
  arrived: "arrived",
  seated: "seated",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "no_show",
};

/** Best-fit active table for a manual (phone-in) booking. */
async function pickBestFitTableId(partySize: number): Promise<string | null> {
  const { data } = await supabase!
    .from("restaurant_tables")
    .select("id, capacity_max")
    .eq("is_active", true)
    .gte("capacity_max", partySize)
    .order("capacity_max", { ascending: true })
    .limit(1);
  const rows = data as { id: string }[] | null;
  if (rows && rows.length > 0) return rows[0].id;
  // No table fits — fall back to the smallest active table so the
  // reservation still records (the booking engine rejects large parties).
  const { data: anyTable } = await supabase!
    .from("restaurant_tables")
    .select("id, capacity_max")
    .eq("is_active", true)
    .order("capacity_max", { ascending: true })
    .limit(1);
  return (anyTable as { id: string }[] | null)?.[0]?.id ?? null;
}

export async function createReservation(r: AdminReservation): Promise<void> {
  const tableId = r.tableId ?? (await pickBestFitTableId(r.partySize));
  if (!tableId) throw new Error("No active tables — add one in Floor Setup first.");
  const { error } = await insertInto("reservations", {
    id: r.id,
    table_id: tableId,
    guest_name: r.guestName,
    guest_email: r.guestEmail,
    guest_phone: r.guestPhone,
    party_size: r.partySize,
    start_time: r.startTime,
    end_time: r.endTime,
    status: (STATUS_TO_DB[r.status] ?? "confirmed") as Tables["reservations"]["Row"]["status"],
    confirmation_code: r.confirmationCode,
    special_requests: r.note ?? null,
  });
  if (error) throw error;
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const { error } = await updateRow("reservations", id, {
    status: (STATUS_TO_DB[status] ?? "confirmed") as Tables["reservations"]["Row"]["status"],
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
