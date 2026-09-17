/**
 * Public-site content types + rich mock data for Crumb & Confetti.
 * The api.ts layer returns Supabase data when configured, otherwise
 * falls back to these mocks so the site is fully browsable without
 * a live project (TRD §5 — public reads only).
 */

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  social_links: { instagram?: string; facebook?: string; tiktok?: string };
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  dietary_tags: string[];
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string;
  display_order: number;
  is_active: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  post_type: "blog" | "event" | "special";
  event_date: string | null;
  is_published: boolean;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_photo_url: string | null;
  rating: number;
  quote: string;
  is_approved: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface BusinessHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

/* ── Image library (from the design mockups) ─────────────────────── */
export const IMG = {
  pie: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuq3J9y67bBgXVoBFWS3DNb4DAHCwL9Vps4478hebJ1TEBjSRYCXzBNRrIxBpuMeCJa7-MSs0ZdMWBaIhVeE1H2soe5d173twFWEtBAr3ZmOgVIR9ahuomi2YCqGEROGmFOld7-S9olxBbbx11HkCMBsUKSA_7SQVjlWI_MuDm_qpU5ticL1LDubBnGeFhUANtrvTDY6QtqBf_hoYQlGyR6TL_SgUcbU8YD5XNfe0bJSdoI1_zK0cmnqtS0mswnLaq1LWHKghDTNI",
  galette:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDvvESsRHDWKvAw87u-N3VvoXHHNdGvQ7gyZv7kQVElS4y_08nacRVTMBhSXWJEBVsfBTG1q9-zi17JLj_qmz2o6uNTRW5KnS1QsLt7q43pNfmcjC8MOvnzRJU1ww52o-h7dd0tgPRzFPbfJ0uZ4hHj_UZqL8mM66-uS2xXeXYC2_HO9yqeBEEbeWDEwZhYLfkvTQQ9NaQ5HQNcU21PaBH8_8vhSc5nMZbGK-Ku4DifJR5KF1YlFsM8",
  latte:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCPNShXSSbrq24h8w1hjSQb2l2Y3WXijJ1YqlHQu7SpOpHBjcvieIUNOBP5pj30TWgnlDgdwtTFgMH5Z9gWAp-Ebt1pIQ42J9l1OJ2d05deQtACJA8pcNBP6VqASQlGPVyBex-5XGMCIdzgqFelLBAYAsMXrwFE-6KCNUAQ3DNZVgoCdNIevy_LK6qLWp1TQ4oP0bDGuk2SSWd8418MLQAASyaG5VdIECBd7sZTLx72u5KFbcFtJFOW",
  cake: "https://lh3.googleusercontent.com/aida-public/AB6AXuAr4ttc2DqBiWG5t0_nPr1fan7FY5Bk_TGH7a4iObhBZNy5AcvB4fWbPKi7c86vnfsyGGwlv5FRswNuGwE_Dh1Fgsui2a4NjKfxHEaok7MHNNR7mdBVmeueSVsoAvIHix5KzMkSgYucuIJqQ0-TfFn0-zS8SAisetJppBmlxQtPIDZ3dAE8ihcLnBcz6Ce6hycgkItij_xca0JmAzXaeRrPDYdQX_pm8i73gpj5m9tKioO_K9nrirY3",
  cookie:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAcluJlSpfHSEcCA0uJtBsvAgfoo3e7WAWF4vx2oL8UEnr-WI1liHAExa7h100GtrmW7jzjZthKm4nl2rJMUT3MgKmcHPkgAzIQOaQXxVUTiPH6x4p-zgb3wlH0vsWuYGbil6dsJYoGB-qNYLjqSCQvDzlf8hNPy3aiR61EkNOlUKp6or-u_lHV0aFliUz_GQtm0OTeHk1MNFI-5d7FdTxGfwSwoLIv5cHptfoYrGCfcCd0wGGc3EUi",
  interior:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCC5DDkqEPlMP-S20aAsW4odGQL6ghzaRBdnRc4JxFL9ajavJpzlNEy2sdMNyzWA6gg2oBm4Xgfc8_eNav8qj5aOnPh6F4YdZvpISsDRkCS5RbqKPWY2Wp4LJQRRsoZ8bdvnC0KV9oisP9sq9h5GOcgtTwPZspkWZjoq6b0IcKPMAqN4woEeLXLL5ChahgJGL8m7iuOyCeqw-TXEQU4I4MvIi60qtjF5OtFU-g3-zTtBUHNZOPhBAQ2",
};

/* ── Mock data ─────────────────────────────────────────────────────── */

export const mockSiteSettings: SiteSettings = {
  name: "Crumb & Confetti",
  tagline: "Baked with Joy",
  description:
    "Artisanal pastries, craft coffee, and a daily dose of celebration in every crumb. Join us for a delightful experience crafted with love and a sprinkle of whimsy.",
  phone: "(555) 010-2026",
  email: "hello@crumbandconfetti.example",
  address: "48 Sprinkle Street",
  city: "Brooklyn",
  country: "USA",
  timezone: "America/New_York",
  currency: "USD",
  social_links: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
};

export const mockMenuCategories: MenuCategory[] = [
  { id: "cat-pastries", name: "Pastries", slug: "pastries", display_order: 1, is_active: true },
  { id: "cat-coffee", name: "Coffee", slug: "coffee", display_order: 2, is_active: true },
  { id: "cat-cakes", name: "Custom Cakes", slug: "custom-cakes", display_order: 3, is_active: true },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: "item-galette",
    category_id: "cat-pastries",
    name: "Seasonal Berry Galette",
    description: "Hand-folded buttery pastry with a mountain of wild forest berries.",
    price: 8,
    image_url: IMG.galette,
    dietary_tags: ["vegetarian"],
    is_featured: true,
    is_available: true,
    display_order: 1,
  },
  {
    id: "item-sprink",
    category_id: "cat-pastries",
    name: "The Salty Sprink",
    description: "Massive dark chocolate chunk cookie with smoked sea salt.",
    price: 4,
    image_url: IMG.cookie,
    dietary_tags: ["vegetarian"],
    is_featured: true,
    is_available: true,
    display_order: 2,
  },
  {
    id: "item-croissant",
    category_id: "cat-pastries",
    name: "Butter Croissant",
    description: "Laminated to golden perfection, flaky on the outside, pillowy within.",
    price: 3.5,
    image_url: IMG.pie,
    dietary_tags: ["vegetarian"],
    is_featured: false,
    is_available: true,
    display_order: 3,
  },
  {
    id: "item-muffin",
    category_id: "cat-pastries",
    name: "Lemon Poppy Muffin",
    description: "Bright citrus crumb, gluten-free friendly, baked fresh every morning.",
    price: 4.25,
    image_url: IMG.interior,
    dietary_tags: ["gluten-free", "vegetarian"],
    is_featured: false,
    is_available: true,
    display_order: 4,
  },
  {
    id: "item-latte",
    category_id: "cat-coffee",
    name: "Confetti Latte",
    description: "Signature blend with vanilla foam and a dash of edible sparkles.",
    price: 6.5,
    image_url: IMG.latte,
    dietary_tags: ["vegetarian"],
    is_featured: true,
    is_available: true,
    display_order: 1,
  },
  {
    id: "item-espresso",
    category_id: "cat-coffee",
    name: "Espresso Shot",
    description: "Double shot of our house blend — bold, chocolatey, unapologetic.",
    price: 3,
    image_url: IMG.latte,
    dietary_tags: ["vegan", "gluten-free"],
    is_featured: false,
    is_available: true,
    display_order: 2,
  },
  {
    id: "item-coldbrew",
    category_id: "cat-coffee",
    name: "Iced Sparkling Cold Brew",
    description: "18-hour steep, topped with fizz and a whisper of orange zest.",
    price: 5.5,
    image_url: IMG.interior,
    dietary_tags: ["vegan", "gluten-free"],
    is_featured: false,
    is_available: true,
    display_order: 3,
  },
  {
    id: "item-sponge",
    category_id: "cat-cakes",
    name: "Cloud Nine Sponge",
    description: "Lemon-infused chiffon with whipped mascarpone and honey.",
    price: 45,
    image_url: IMG.cake,
    dietary_tags: ["vegetarian"],
    is_featured: true,
    is_available: false,
    display_order: 1,
  },
  {
    id: "item-bundt",
    category_id: "cat-cakes",
    name: "Birthday Bash Bundt",
    description: "Confetti-flecked vanilla bundt with cream-cheese glaze.",
    price: 32,
    image_url: IMG.cake,
    dietary_tags: ["vegetarian"],
    is_featured: false,
    is_available: true,
    display_order: 2,
  },
];

export const mockGalleryImages: GalleryImage[] = [
  { id: "g1", image_url: IMG.pie, alt_text: "Freshly baked cherry pie with lattice crust", caption: "The Sunday Pie", display_order: 1, is_active: true },
  { id: "g2", image_url: IMG.galette, alt_text: "Seasonal berry galette with golden crust", caption: "Berry Galette Season", display_order: 2, is_active: true },
  { id: "g3", image_url: IMG.latte, alt_text: "Latte with heart-shaped foam art", caption: "Heart in Every Cup", display_order: 3, is_active: true },
  { id: "g4", image_url: IMG.cake, alt_text: "Three-tier celebration cake with gold confetti", caption: "Custom Cake Corner", display_order: 4, is_active: true },
  { id: "g5", image_url: IMG.cookie, alt_text: "Oversized chocolate chip cookie with sea salt", caption: "The Salty Sprink", display_order: 5, is_active: true },
  { id: "g6", image_url: IMG.interior, alt_text: "Warm, playful bakery interior", caption: "Inside the Bakehouse", display_order: 6, is_active: true },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: "post-1",
    title: "Jazz & Jam: Live Music Night",
    slug: "jazz-and-jam-live-music-night",
    excerpt: "Swing by for an evening of live jazz, fresh jam pastries, and bottomless sparkle.",
    content:
      "Every third Thursday we clear the counter, dim the sprinkle lamps, and let the rhythm take over. Join us for an evening of live jazz with our friends from the borough, plus a rotating plate of jam-filled specials baked that afternoon. Doors at 7, first note at 7:30.",
    cover_image_url: IMG.pie,
    post_type: "event",
    event_date: "2026-08-20",
    is_published: true,
  },
  {
    id: "post-2",
    title: "Weekend Special: Peach Melba Danish",
    slug: "weekend-special-peach-melba-danish",
    excerpt: "Sweet peaches, tart raspberry, and a snowdrift of vanilla glaze — only while the fruit lasts.",
    content:
      "Our weekend special is a love letter to summer: ripe peach chunks folded into flaky laminated dough, a blush of raspberry compote, and a dusting of vanilla glaze. Available Friday through Sunday while the market peaches hold out.",
    cover_image_url: IMG.galette,
    post_type: "special",
    event_date: null,
    is_published: true,
  },
  {
    id: "post-3",
    title: "Meet Our Head Baker: The Story Behind the Sprinkles",
    slug: "meet-our-head-baker",
    excerpt: "From a home oven in Queens to 40 pounds of confetti a month — meet the hands behind the magic.",
    content:
      "If you've ever wondered who obsesses over the exact crunch of a sprink, meet Maya. Her story starts with a burnt first batch of scones and a stubborn belief that baking should feel like a party. Today she leads a small team that turns flour, butter, and joy into the case you see every morning.",
    cover_image_url: IMG.cookie,
    post_type: "blog",
    event_date: null,
    is_published: true,
  },
  {
    id: "post-4",
    title: "Sourdough 101: Our Loaf, Deconstructed",
    slug: "sourdough-101",
    excerpt: "The 72-hour journey from starter to crust, explained by the people who do it daily.",
    content:
      "Our sourdough starts as a 40-year-old starter named Gerald. This post walks through the full 72-hour timeline — feeding, fermenting, shaping, and the long cold proof — so you can taste the difference a little patience makes.",
    cover_image_url: IMG.interior,
    post_type: "blog",
    event_date: null,
    is_published: true,
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: "t1",
    customer_name: "Maya R.",
    customer_photo_url: null,
    rating: 5,
    quote: "The Confetti Latte is pure joy in a mug. Booking a table online took me thirty seconds flat.",
    is_approved: true,
    is_featured: true,
    display_order: 1,
  },
  {
    id: "t2",
    customer_name: "Daniel K.",
    customer_photo_url: null,
    rating: 5,
    quote: "They built a three-tier cake for my daughter's party that looked like a confetti explosion — in the best way.",
    is_approved: true,
    is_featured: true,
    display_order: 2,
  },
  {
    id: "t3",
    customer_name: "Priya S.",
    customer_photo_url: null,
    rating: 5,
    quote: "Our team brunch spot. The galette season is a real thing and I respect it deeply.",
    is_approved: true,
    is_featured: true,
    display_order: 3,
  },
];

export const mockBusinessHours: BusinessHours[] = [
  { day_of_week: 0, open_time: "08:00", close_time: "18:00", is_closed: false },
  { day_of_week: 1, open_time: "08:00", close_time: "18:00", is_closed: true },
  { day_of_week: 2, open_time: "08:00", close_time: "18:00", is_closed: false },
  { day_of_week: 3, open_time: "08:00", close_time: "18:00", is_closed: false },
  { day_of_week: 4, open_time: "08:00", close_time: "18:00", is_closed: false },
  { day_of_week: 5, open_time: "08:00", close_time: "18:00", is_closed: false },
  { day_of_week: 6, open_time: "08:00", close_time: "18:00", is_closed: false },
];
