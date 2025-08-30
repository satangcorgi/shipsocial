import { BrandProfile, VoiceCard, Pillar, Post, ScheduleWindow, Platform } from "./types";

type State = {
  brand: BrandProfile | null;
  voiceCard: VoiceCard | null;
  pillars: Pillar[];
  posts: Post[];
  windows: ScheduleWindow[];
  credits: number; // mock monthly credits for regen
};

// --- GLOBAL SINGLETON (persists across HMR/module reloads) ---
const g = globalThis as any;
if (!g.__SHIP_SOCIAL_STATE__) {
  g.__SHIP_SOCIAL_STATE__ = {
    brand: null,
    voiceCard: null,
    pillars: [],
    posts: [],
    windows: [],
    credits: 0,
  } as State;
}
const state: State = g.__SHIP_SOCIAL_STATE__;

// --- helpers ---
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Ensure any missing keys are initialized when upgrading the store shape
function ensureDefaults() {
  if (typeof state.credits !== "number" || Number.isNaN(state.credits)) {
    state.credits = 200; // default for Phase 1 (Creator plan mock)
  }
  if (!Array.isArray(state.windows)) state.windows = [];
  if (!Array.isArray(state.posts)) state.posts = [];
  if (!Array.isArray(state.pillars)) state.pillars = [];
}

// Seed demo ONLY IF EMPTY (so onboarding updates stick)
function seedIfEmpty() {
  if (state.brand !== null) return;

  state.brand = {
    id: "brand_demo",
    name: "Demo Brand",
    website: "https://example.com",
    palette: ["#111827", "#6D28D9", "#F3F4F6"],
    tonePrefs: "dry, clear, friendly",
  };

  state.voiceCard = {
    brandSummary: "We help small SaaS ship tiny improvements that compound.",
    audience: ["micro-SaaS founders", "indie hackers", "solo marketers"],
    do: ["use concrete examples", "be concise", "prefer steps over fluff"],
    dont: ["no hype", "avoid jargon", "no exclamation marks"],
    tone: ["dry", "friendly"],
    phrases: ["ship daily", "tiny wins compound", "show your homework"],
    banned: ["!"],
  };

  state.pillars = [
    { id: uid(), name: "Tutorials", desc: "Short, do-this-now walkthroughs." },
    { id: uid(), name: "Proof Notes", desc: "Mini case studies and wins." },
    { id: uid(), name: "Founder Notes", desc: "Behind-the-scenes decisions." },
  ];

  state.windows = [
    { platform: "linkedin", start: "09:30", end: "11:00", tz: "Asia/Manila" },
    { platform: "instagram", start: "16:00", end: "18:00", tz: "Asia/Manila" },
    { platform: "x", start: "12:00", end: "13:00", tz: "Asia/Manila" },
    { platform: "facebook", start: "19:00", end: "20:30", tz: "Asia/Manila" },
  ];

  state.posts = [];
  state.credits = 200;
}

// run migrations/defaults first, then seed if brand is empty
ensureDefaults();
seedIfEmpty();

// --- getters / setters ---
export function getBrand(): BrandProfile | null {
  return state.brand;
}
export function setBrand(b: BrandProfile) {
  state.brand = b;
}

export function getVoiceCard(): VoiceCard | null {
  return state.voiceCard;
}
export function setVoiceCard(v: VoiceCard) {
  state.voiceCard = v;
}

export function getPillars(): Pillar[] {
  return state.pillars;
}
export function setPillars(p: Pillar[]) {
  state.pillars = p;
}

export function listPosts(): Post[] {
  return state.posts;
}
export function addPost(p: Omit<Post, "id">): Post {
  const post: Post = { ...p, id: uid() };
  state.posts.unshift(post);
  return post;
}
export function updatePost(id: string, patch: Partial<Post>): Post | null {
  const i = state.posts.findIndex((x) => x.id === id);
  if (i === -1) return null;
  state.posts[i] = { ...state.posts[i], ...patch };
  return state.posts[i];
}

export function getWindows(): ScheduleWindow[] {
  return state.windows;
}
export function setWindow(platform: Platform, win: Omit<ScheduleWindow, "platform">) {
  const i = state.windows.findIndex((w) => w.platform === platform);
  const next: ScheduleWindow = { platform, ...win };
  if (i === -1) state.windows.push(next);
  else state.windows[i] = next;
}

// --- credits (mock) ---
export function getCredits(): number {
  return state.credits;
}
export function setCredits(n: number) {
  state.credits = Math.max(0, Math.floor(n));
}
export function consumeCredit(n = 1): boolean {
  if (state.credits < n) return false;
  state.credits -= n;
  return true;
}

// Optional: manual reset (not called automatically)
export function resetDemo() {
  state.brand = null;
  state.voiceCard = null;
  state.pillars = [];
  state.posts = [];
  state.windows = [];
  state.credits = 0;
  ensureDefaults();
  seedIfEmpty();
}

// For quick debug if needed
export const __state = state;