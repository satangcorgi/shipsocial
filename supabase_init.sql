-- Enums
DO $$ BEGIN
  CREATE TYPE "Platform" AS ENUM ('LINKEDIN','INSTAGRAM','X','FACEBOOK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PostStatus" AS ENUM ('DRAFT','SCHEDULED','PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "Brand" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "website"   TEXT,
  "palette"   TEXT[] NOT NULL,
  "voiceCard" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Pillar" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "desc"      TEXT NOT NULL,
  "brandId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pillar_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$ BEGIN
  CREATE UNIQUE INDEX "Pillar_brandId_name_key" ON "Pillar"("brandId","name");
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Window" (
  "id"        TEXT PRIMARY KEY,
  "brandId"   TEXT NOT NULL,
  "platform"  "Platform" NOT NULL,
  "start"     TEXT NOT NULL,
  "end"       TEXT NOT NULL,
  "tz"        TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Window_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Post" (
  "id"          TEXT PRIMARY KEY,
  "brandId"     TEXT NOT NULL,
  "pillarId"    TEXT,
  "platform"    "Platform" NOT NULL,
  "status"      "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "title"       TEXT,
  "body"        TEXT NOT NULL,
  "altText"     TEXT,
  "hashtags"    TEXT[] NOT NULL,
  "whyNote"     TEXT,
  "framework"   TEXT,
  "assetUrl"    TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_brandId_fkey"  FOREIGN KEY ("brandId")  REFERENCES "Brand"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Post_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

DO $$ BEGIN
  CREATE INDEX "Post_brandId_idx"             ON "Post"("brandId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE INDEX "Post_pillarId_idx"            ON "Post"("pillarId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE INDEX "Post_status_scheduledAt_idx"  ON "Post"("status","scheduledAt");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;