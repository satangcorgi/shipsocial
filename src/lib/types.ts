export type Platform = "linkedin" | "instagram" | "x" | "facebook";

export type Framework =
  | "carnegie"
  | "cialdini"
  | "succes"
  | "hormozi"
  | "atomic"
  | "lean";

export type VoiceCard = {
  brandSummary: string;
  audience: string[];
  do: string[];
  dont: string[];
  tone: string[]; // e.g., ["dry","playful"]
  phrases: string[];
  banned: string[]; // e.g., ["!"]
};

export type Pillar = {
  id: string;
  name: string;
  desc: string;
};

export type PostStatus = "draft" | "scheduled" | "published";

export type Post = {
  id: string;
  platform: Platform;
  status: PostStatus;
  scheduledAt?: string; // ISO
  title?: string;
  body: string;
  altText: string;
  hashtags: string[];
  whyNote: string;
  framework: Framework;
  pillarId: string;
  assetUrl?: string;
};

export type ScheduleWindow = {
  platform: Platform;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  tz: string;    // e.g., "Asia/Manila"
};

export type BrandProfile = {
  id: string;
  name: string;
  website?: string;
  palette: string[]; // hex colors
  tonePrefs?: string;
};