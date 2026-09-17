/**
 * Phase 3 — Admin CMS data layer.
 *
 * Two backends, one store interface:
 *
 *  - Supabase (configured via .env): `hydrate()` replaces the seeds with
 *    live rows from the Phase 3 tables, and every mutation writes through
 *    to the DB (optimistic local update, revert on failure). RLS means
 *    these calls only succeed for users provisioned in public.admins.
 *
 *  - Demo mode (no .env): the store persists to localStorage and mirrors
 *    the same table shapes, so the full CMS is browsable offline.
 *
 * The action signatures never change, so swapping backends is invisible
 * to the admin pages.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  BlogPost,
  BusinessHours,
  GalleryImage,
  MenuCategory,
  MenuItem,
  SiteSettings,
  Testimonial,
} from "@/lib/content";
import {
  mockSiteSettings,
  mockMenuCategories,
  mockMenuItems,
  mockGalleryImages,
  mockBlogPosts,
  mockTestimonials,
  mockBusinessHours,
} from "@/lib/content";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import * as adminApi from "@/lib/adminApi";

/* ── Admin-only types (Phase 3 tables) ─────────────────────────────── */

export type ReservationStatus =
  | "confirmed"
  | "arrived"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface AdminReservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  /** ISO timestamp of slot start. */
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  confirmationCode: string;
  note?: string;
  tableId?: string;
  /** Visit count, for the VIP nudge in the feed. */
  visits?: number;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  isActive: boolean;
}

export interface HolidayClosure {
  id: string;
  date: string; // "2026-08-20"
  reason: string;
  isFullDay: boolean;
  closedFrom?: string;
  closedTo?: string;
}

/** Raw reservations row shape as delivered by the realtime channel. */
type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];

/** The live reservations channel (Supabase mode). Null in demo mode / when torn down. */
let realtimeChannel: RealtimeChannel | null = null;

/* ── Seed data (demo mode only — Supabase hydrate replaces these) ─── */

function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const seedTables: RestaurantTable[] = [
  { id: "t1", tableNumber: "T1", section: "Window", capacity: 2, isActive: true },
  { id: "t2", tableNumber: "T2", section: "Window", capacity: 2, isActive: true },
  { id: "t3", tableNumber: "T3", section: "Window", capacity: 4, isActive: true },
  { id: "t4", tableNumber: "T4", section: "Counter", capacity: 1, isActive: true },
  { id: "t5", tableNumber: "T5", section: "Counter", capacity: 1, isActive: true },
  { id: "t6", tableNumber: "T6", section: "Counter", capacity: 2, isActive: true },
  { id: "t7", tableNumber: "T7", section: "Counter", capacity: 2, isActive: false },
  { id: "t8", tableNumber: "T8", section: "Patio", capacity: 4, isActive: true },
  { id: "t9", tableNumber: "T9", section: "Patio", capacity: 6, isActive: true },
  { id: "t10", tableNumber: "T10", section: "Patio", capacity: 4, isActive: false },
  { id: "t11", tableNumber: "T11", section: "Party Corner", capacity: 8, isActive: true },
  { id: "t12", tableNumber: "T12", section: "Party Corner", capacity: 10, isActive: true },
];

const seedReservations: AdminReservation[] = [
  { id: "r1", guestName: "Jane Doe", guestEmail: "jane@example.com", guestPhone: "(555) 010-1111", partySize: 4, startTime: todayAt(10, 30), endTime: todayAt(12, 0), status: "confirmed", confirmationCode: "SPK7F2KA", note: "VIP • 4th visit", tableId: "t3", visits: 4 },
  { id: "r2", guestName: "Mark Smith", guestEmail: "mark@example.com", guestPhone: "(555) 010-2222", partySize: 8, startTime: todayAt(11, 0), endTime: todayAt(12, 30), status: "arrived", confirmationCode: "JAM8QX3B", note: "Birthday Bash", tableId: "t11", visits: 1 },
  { id: "r3", guestName: "Alice Higgins", guestEmail: "alice@example.com", guestPhone: "(555) 010-3333", partySize: 2, startTime: todayAt(11, 15), endTime: todayAt(12, 45), status: "seated", confirmationCode: "MUF4PL9C", note: "Casual Brunch", tableId: "t1", visits: 2 },
  { id: "r4", guestName: "Tom Lee", guestEmail: "tom@example.com", guestPhone: "(555) 010-4444", partySize: 3, startTime: todayAt(12, 0), endTime: todayAt(13, 30), status: "confirmed", confirmationCode: "KEX5WR2D", note: "Business Lunch", tableId: "t6", visits: 3 },
  { id: "r5", guestName: "Sofia Reyes", guestEmail: "sofia@example.com", guestPhone: "(555) 010-5555", partySize: 2, startTime: todayAt(13, 0), endTime: todayAt(14, 30), status: "completed", confirmationCode: "QAZ7VBN1", note: "Anniversary", visits: 2 },
  { id: "r6", guestName: "Noah Patel", guestEmail: "noah@example.com", guestPhone: "(555) 010-6666", partySize: 5, startTime: todayAt(14, 0), endTime: todayAt(15, 30), status: "cancelled", confirmationCode: "TYU8MKL9", note: "Cancelled by guest" },
  { id: "r7", guestName: "Emma Wilson", guestEmail: "emma@example.com", guestPhone: "(555) 010-7777", partySize: 2, startTime: todayAt(15, 0), endTime: todayAt(16, 30), status: "no_show", confirmationCode: "GHJ3RFV8", note: "No show", tableId: "t2" },
  { id: "r8", guestName: "Liam Chen", guestEmail: "liam@example.com", guestPhone: "(555) 010-8888", partySize: 6, startTime: todayAt(16, 0), endTime: todayAt(17, 30), status: "confirmed", confirmationCode: "POK2WSD4", note: "Team dinner", tableId: "t9", visits: 1 },
  { id: "r9", guestName: "Ava Kumar", guestEmail: "ava@example.com", guestPhone: "(555) 010-9999", partySize: 2, startTime: todayAt(17, 0), endTime: todayAt(18, 30), status: "confirmed", confirmationCode: "ZXC6YHN7", note: "Date night", tableId: "t8" },
];

const seedHolidays: HolidayClosure[] = [
  { id: "h1", date: "2026-12-25", reason: "Christmas Day", isFullDay: true },
  { id: "h2", date: "2026-11-26", reason: "Thanksgiving", isFullDay: true },
  { id: "h3", date: "2026-08-24", reason: "Kitchen deep-clean", isFullDay: false, closedFrom: "14:00", closedTo: "18:00" },
];

/* ── Store ─────────────────────────────────────────────────────────── */

export type MenuItemDraft = Omit<MenuItem, "id">;
export type TableDraft = Omit<RestaurantTable, "id">;
export type HolidayDraft = Omit<HolidayClosure, "id">;
export type ReservationDraft = Omit<AdminReservation, "id" | "confirmationCode">;

interface AdminState {
  settings: SiteSettings;
  categories: MenuCategory[];
  items: MenuItem[];
  gallery: GalleryImage[];
  posts: BlogPost[];
  testimonials: Testimonial[];
  hours: BusinessHours[];
  tables: RestaurantTable[];
  holidays: HolidayClosure[];
  reservations: AdminReservation[];
  /** True once live Supabase rows have replaced the demo seeds. */
  hydrated: boolean;
  /** True while the reservations realtime channel is connected (Supabase mode). */
  realtimeActive: boolean;

  /** Replace demo seeds with live Supabase rows (no-op in demo mode). */
  hydrate: () => Promise<void>;

  /** Open the live reservations channel (no-op in demo mode). Idempotent. */
  subscribeReservations: () => void;
  /** Close the live reservations channel. */
  unsubscribeReservations: () => void;

  /* settings */
  saveSettings: (patch: Partial<SiteSettings>) => void;

  /* menu */
  addCategory: (draft: Omit<MenuCategory, "id">) => void;
  updateCategory: (id: string, patch: Partial<MenuCategory>) => void;
  deleteCategory: (id: string) => void;
  addItem: (draft: MenuItemDraft) => void;
  updateItem: (id: string, patch: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;

  /* gallery */
  addGalleryImage: (draft: Omit<GalleryImage, "id">) => void;
  updateGalleryImage: (id: string, patch: Partial<GalleryImage>) => void;
  deleteGalleryImage: (id: string) => void;
  moveGalleryImage: (id: string, dir: -1 | 1) => void;

  /* blog */
  addPost: (draft: Omit<BlogPost, "id">) => void;
  updatePost: (id: string, patch: Partial<BlogPost>) => void;
  deletePost: (id: string) => void;

  /* testimonials */
  addTestimonial: (draft: Omit<Testimonial, "id">) => void;
  updateTestimonial: (id: string, patch: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  moveTestimonial: (id: string, dir: -1 | 1) => void;

  /* hours */
  updateHours: (dayOfWeek: number, patch: Partial<BusinessHours>) => void;
  addHoliday: (draft: HolidayDraft) => void;
  deleteHoliday: (id: string) => void;

  /* tables */
  addTable: (draft: TableDraft) => void;
  updateTable: (id: string, patch: Partial<RestaurantTable>) => void;
  deleteTable: (id: string) => void;

  /* reservations */
  addReservation: (draft: ReservationDraft) => void;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function mockCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Log a failed write-through (state already reverted). */
function logWriteFailure(op: string, err: unknown): void {
  console.error(`[admin] ${op} failed to sync to Supabase:`, err);
}

/** Guard so hydrate() only runs once per session. */
let hydratedRef = false;

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      settings: mockSiteSettings,
      categories: mockMenuCategories,
      items: mockMenuItems,
      gallery: mockGalleryImages,
      posts: mockBlogPosts,
      testimonials: mockTestimonials,
      hours: mockBusinessHours,
      tables: seedTables,
      holidays: seedHolidays,
      reservations: seedReservations,
      hydrated: false,
      realtimeActive: false,

      hydrate: async () => {
        if (!isSupabaseConfigured || hydratedRef) return;
        hydratedRef = true;
        try {
          const data = await adminApi.loadAdminData();
          set({
            settings: data.settings ?? mockSiteSettings,
            categories: data.categories,
            items: data.items,
            gallery: data.gallery,
            posts: data.posts,
            testimonials: data.testimonials,
            hours: data.hours,
            holidays: data.holidays,
            tables: data.tables,
            reservations: data.reservations,
            hydrated: true,
          });
        } catch (err) {
          console.error("[admin] failed to hydrate from Supabase:", err);
          hydratedRef = false; // allow a retry
        }
      },

      /* ── settings ─────────────────────────────────────────────── */
      saveSettings: (patch) => {
        const prev = get().settings;
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        if (isSupabaseConfigured) {
          adminApi.persistSettings(patch).catch((err) => {
            logWriteFailure("settings save", err);
            set({ settings: prev });
          });
        }
      },

      /* ── menu categories ──────────────────────────────────────── */
      addCategory: (draft) => {
        const category = { ...draft, id: uid("cat") };
        set((s) => ({ categories: [...s.categories, category] }));
        if (isSupabaseConfigured) {
          adminApi.createCategory(draft).catch((err) => {
            logWriteFailure("category create", err);
            set((s) => ({ categories: s.categories.filter((c) => c.id !== category.id) }));
          });
        }
      },
      updateCategory: (id, patch) => {
        const prev = get().categories.find((c) => c.id === id);
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        if (isSupabaseConfigured) {
          adminApi.updateCategory(id, patch).catch((err) => {
            logWriteFailure("category update", err);
            set((s) => ({ categories: s.categories.map((c) => (c.id === id && prev ? prev : c)) }));
          });
        }
      },
      deleteCategory: (id) => {
        const prev = get().categories;
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteCategory(id).catch((err) => {
            logWriteFailure("category delete", err);
            set({ categories: prev });
          });
        }
      },

      /* ── menu items ───────────────────────────────────────────── */
      addItem: (draft) => {
        const item = { ...draft, id: uid("item") };
        set((s) => ({ items: [...s.items, item] }));
        if (isSupabaseConfigured) {
          adminApi.createMenuItem(item).catch((err) => {
            logWriteFailure("menu item create", err);
            set((s) => ({ items: s.items.filter((i) => i.id !== item.id) }));
          });
        }
      },
      updateItem: (id, patch) => {
        const prev = get().items.find((i) => i.id === id);
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
        if (isSupabaseConfigured) {
          adminApi.updateMenuItem(id, patch).catch((err) => {
            logWriteFailure("menu item update", err);
            set((s) => ({ items: s.items.map((i) => (i.id === id && prev ? prev : i)) }));
          });
        }
      },
      deleteItem: (id) => {
        const prev = get().items;
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteMenuItem(id).catch((err) => {
            logWriteFailure("menu item delete", err);
            set({ items: prev });
          });
        }
      },

      /* ── gallery ──────────────────────────────────────────────── */
      addGalleryImage: (draft) => {
        const image = { ...draft, id: uid("g") };
        set((s) => ({ gallery: [...s.gallery, image] }));
        if (isSupabaseConfigured) {
          adminApi.createGalleryImage(image).catch((err) => {
            logWriteFailure("gallery create", err);
            set((s) => ({ gallery: s.gallery.filter((g) => g.id !== image.id) }));
          });
        }
      },
      updateGalleryImage: (id, patch) => {
        const prev = get().gallery.find((g) => g.id === id);
        set((s) => ({ gallery: s.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
        if (isSupabaseConfigured) {
          adminApi.updateGalleryImage(id, patch).catch((err) => {
            logWriteFailure("gallery update", err);
            set((s) => ({ gallery: s.gallery.map((g) => (g.id === id && prev ? prev : g)) }));
          });
        }
      },
      deleteGalleryImage: (id) => {
        const prev = get().gallery;
        set((s) => ({ gallery: s.gallery.filter((g) => g.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteGalleryImage(id).catch((err) => {
            logWriteFailure("gallery delete", err);
            set({ gallery: prev });
          });
        }
      },
      moveGalleryImage: (id, dir) => {
        const prev = get().gallery;
        set((s) => {
          const idx = s.gallery.findIndex((g) => g.id === id);
          const target = idx + dir;
          if (idx < 0 || target < 0 || target >= s.gallery.length) return s;
          const next = [...s.gallery];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { gallery: next.map((g, i) => ({ ...g, display_order: i + 1 })) };
        });
        if (isSupabaseConfigured) {
          const idx = prev.findIndex((g) => g.id === id);
          const neighbor = idx + dir >= 0 && idx + dir < prev.length ? prev[idx + dir] : null;
          const next = get().gallery;
          const moved = next.find((g) => g.id === id);
          if (!moved) return;
          // Persist the two swapped rows' new display_order.
          Promise.all([
            adminApi.updateGalleryImage(moved.id, { display_order: moved.display_order }),
            ...(neighbor
              ? [
                  adminApi.updateGalleryImage(neighbor.id, {
                    display_order: next.find((g) => g.id === neighbor.id)?.display_order ?? neighbor.display_order,
                  }),
                ]
              : []),
          ]).catch((err) => {
            logWriteFailure("gallery reorder", err);
            set({ gallery: prev });
          });
        }
      },

      /* ── blog ─────────────────────────────────────────────────── */
      addPost: (draft) => {
        const post = { ...draft, id: uid("post") };
        set((s) => ({ posts: [post, ...s.posts] }));
        if (isSupabaseConfigured) {
          adminApi.createPost(post).catch((err) => {
            logWriteFailure("post create", err);
            set((s) => ({ posts: s.posts.filter((p) => p.id !== post.id) }));
          });
        }
      },
      updatePost: (id, patch) => {
        const prev = get().posts.find((p) => p.id === id);
        set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        if (isSupabaseConfigured) {
          adminApi.updatePost(id, patch).catch((err) => {
            logWriteFailure("post update", err);
            set((s) => ({ posts: s.posts.map((p) => (p.id === id && prev ? prev : p)) }));
          });
        }
      },
      deletePost: (id) => {
        const prev = get().posts;
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deletePost(id).catch((err) => {
            logWriteFailure("post delete", err);
            set({ posts: prev });
          });
        }
      },

      /* ── testimonials ─────────────────────────────────────────── */
      addTestimonial: (draft) => {
        const t = { ...draft, id: uid("t") };
        set((s) => ({ testimonials: [...s.testimonials, t] }));
        if (isSupabaseConfigured) {
          adminApi.createTestimonial(t).catch((err) => {
            logWriteFailure("testimonial create", err);
            set((s) => ({ testimonials: s.testimonials.filter((x) => x.id !== t.id) }));
          });
        }
      },
      updateTestimonial: (id, patch) => {
        const prev = get().testimonials.find((x) => x.id === id);
        set((s) => ({
          testimonials: s.testimonials.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        if (isSupabaseConfigured) {
          adminApi.updateTestimonial(id, patch).catch((err) => {
            logWriteFailure("testimonial update", err);
            set((s) => ({
              testimonials: s.testimonials.map((x) => (x.id === id && prev ? prev : x)),
            }));
          });
        }
      },
      deleteTestimonial: (id) => {
        const prev = get().testimonials;
        set((s) => ({ testimonials: s.testimonials.filter((x) => x.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteTestimonial(id).catch((err) => {
            logWriteFailure("testimonial delete", err);
            set({ testimonials: prev });
          });
        }
      },
      moveTestimonial: (id, dir) => {
        const prev = get().testimonials;
        set((s) => {
          const idx = s.testimonials.findIndex((x) => x.id === id);
          const target = idx + dir;
          if (idx < 0 || target < 0 || target >= s.testimonials.length) return s;
          const next = [...s.testimonials];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { testimonials: next.map((x, i) => ({ ...x, display_order: i + 1 })) };
        });
        if (isSupabaseConfigured) {
          const idx = prev.findIndex((x) => x.id === id);
          const neighbor = idx + dir >= 0 && idx + dir < prev.length ? prev[idx + dir] : null;
          const next = get().testimonials;
          const moved = next.find((x) => x.id === id);
          if (!moved) return;
          Promise.all([
            adminApi.updateTestimonial(moved.id, { display_order: moved.display_order }),
            ...(neighbor
              ? [
                  adminApi.updateTestimonial(neighbor.id, {
                    display_order: next.find((x) => x.id === neighbor.id)?.display_order ?? neighbor.display_order,
                  }),
                ]
              : []),
          ]).catch((err) => {
            logWriteFailure("testimonial reorder", err);
            set({ testimonials: prev });
          });
        }
      },

      /* ── hours & holidays ─────────────────────────────────────── */
      updateHours: (dayOfWeek, patch) => {
        const prev = get().hours.find((h) => h.day_of_week === dayOfWeek);
        set((s) => ({
          hours: s.hours.map((h) => (h.day_of_week === dayOfWeek ? { ...h, ...patch } : h)),
        }));
        if (isSupabaseConfigured) {
          adminApi.upsertBusinessHours(dayOfWeek, patch).catch((err) => {
            logWriteFailure("hours update", err);
            set((s) => ({
              hours: s.hours.map((h) => (h.day_of_week === dayOfWeek && prev ? prev : h)),
            }));
          });
        }
      },
      addHoliday: (draft) => {
        const holiday = { ...draft, id: uid("hol") };
        set((s) => ({ holidays: [...s.holidays, holiday] }));
        if (isSupabaseConfigured) {
          adminApi.createHoliday(holiday).catch((err) => {
            logWriteFailure("holiday create", err);
            set((s) => ({ holidays: s.holidays.filter((h) => h.id !== holiday.id) }));
          });
        }
      },
      deleteHoliday: (id) => {
        const prev = get().holidays;
        set((s) => ({ holidays: s.holidays.filter((h) => h.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteHoliday(id).catch((err) => {
            logWriteFailure("holiday delete", err);
            set({ holidays: prev });
          });
        }
      },

      /* ── tables ───────────────────────────────────────────────── */
      addTable: (draft) => {
        const table = { ...draft, id: uid("tbl") };
        set((s) => ({ tables: [...s.tables, table] }));
        if (isSupabaseConfigured) {
          adminApi.createTable(table).catch((err) => {
            logWriteFailure("table create", err);
            set((s) => ({ tables: s.tables.filter((t) => t.id !== table.id) }));
          });
        }
      },
      updateTable: (id, patch) => {
        const prev = get().tables.find((t) => t.id === id);
        set((s) => ({ tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
        if (isSupabaseConfigured) {
          adminApi.updateTable(id, patch).catch((err) => {
            logWriteFailure("table update", err);
            set((s) => ({ tables: s.tables.map((t) => (t.id === id && prev ? prev : t)) }));
          });
        }
      },
      deleteTable: (id) => {
        const prev = get().tables;
        set((s) => ({ tables: s.tables.filter((t) => t.id !== id) }));
        if (isSupabaseConfigured) {
          adminApi.deleteTable(id).catch((err) => {
            logWriteFailure("table delete", err);
            set({ tables: prev });
          });
        }
      },

      /* ── realtime (doc §8 — Supabase mode only) ───────────────── */
      subscribeReservations: () => {
        if (!isSupabaseConfigured || !supabase) return;
        // Idempotent: tear down any previous channel first, so a StrictMode
        // double-mount in dev or a re-login after sign-out can't leak sockets.
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
        const channel = supabase
          .channel("admin-reservations")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "reservations" },
            (payload) => {
              // DELETE payloads carry the row (id at minimum) in `old`.
              if (payload.eventType === "DELETE") {
                const id = (payload.old as ReservationRow | undefined)?.id;
                if (!id) return;
                set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) }));
                return;
              }
              // INSERT/UPDATE payloads carry the full new row in `new`.
              const raw = payload.new as ReservationRow | undefined;
              if (!raw?.id) return;
              const mapped = adminApi.mapReservation(raw);
              set((s) => {
                // Upsert: a row we optimistically created may echo back, and an
                // update for an unknown id means we missed its INSERT.
                const exists = s.reservations.some((r) => r.id === mapped.id);
                return exists
                  ? { reservations: s.reservations.map((r) => (r.id === mapped.id ? mapped : r)) }
                  : { reservations: [...s.reservations, mapped] };
              });
            }
          )
          .subscribe((status) => {
            set({ realtimeActive: status === "SUBSCRIBED" });
          });
        realtimeChannel = channel;
      },
      unsubscribeReservations: () => {
        if (realtimeChannel && supabase) {
          supabase.removeChannel(realtimeChannel);
        }
        realtimeChannel = null;
        set({ realtimeActive: false });
      },

      /* ── reservations ─────────────────────────────────────────── */
      addReservation: (draft) => {
        const reservation = { ...draft, id: uid("res"), confirmationCode: mockCode() };
        set((s) => ({ reservations: [...s.reservations, reservation] }));
        if (isSupabaseConfigured) {
          adminApi.createReservation(reservation).catch((err) => {
            logWriteFailure("reservation create", err);
            set((s) => ({
              reservations: s.reservations.filter((r) => r.id !== reservation.id),
            }));
          });
        }
      },
      setReservationStatus: (id, status) => {
        const prev = get().reservations.find((r) => r.id === id);
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        if (isSupabaseConfigured) {
          adminApi.updateReservationStatus(id, status).catch((err) => {
            logWriteFailure("reservation status update", err);
            set((s) => ({
              reservations: s.reservations.map((r) => (r.id === id && prev ? prev : r)),
            }));
          });
        }
      },
    }),
    {
      name: "crumb-confetti-admin-v1",
      version: 1,
      partialize: (s) => {
        const { hydrated: _hydrated, realtimeActive: _realtimeActive, ...rest } = s;
        return rest;
      },
    }
  )
);
