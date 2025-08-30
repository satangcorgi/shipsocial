import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@prisma/client";

/** Small helpers */
function splitLines(s?: string) {
  if (!s) return [] as string[];
  return s
    .split(/[\n,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Defaults used if none provided */
const DEFAULT_PILLARS = ["Tutorials", "Proof Stories", "Behind the Scenes"];
const DEFAULT_PALETTE = ["#111827", "#6D28D9", "#F3F4F6"];
const PLATFORMS: Platform[] = ["LINKEDIN", "INSTAGRAM", "X", "FACEBOOK"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const nameIn = (body?.name ?? "").toString().trim() || "ShipSocial Demo";
    const websiteIn = (body?.website ?? "").toString().trim() || "https://example.com";
    const pillarsIn = splitLines(body?.pillars);
    const paletteIn = splitLines(body?.palette);

    // Build a minimal voiceCard. Never send undefined to a required Json column.
    const voiceCard = {
      tone: splitLines(body?.tone),
      do: splitLines(body?.do),
      dont: splitLines(body?.dont),
      phrases: splitLines(body?.phrases),
      banned: splitLines(body?.banned),
      audience: splitLines(body?.audience),
    };

    // Ensure a brand exists (voiceCard and palette always provided)
    let brand = await prisma.brand.findFirst();
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: nameIn,
          website: websiteIn,
          palette: paletteIn.length ? paletteIn : DEFAULT_PALETTE,
          voiceCard, // never undefined
        },
      });
    } else {
      brand = await prisma.brand.update({
        where: { id: brand.id },
        data: {
          name: nameIn,
          website: websiteIn,
          palette: paletteIn.length ? paletteIn : brand.palette,
          voiceCard, // overwrite with latest (safe)
        },
      });
    }

    // Ensure pillars (IMPORTANT: desc is "", not null)
    const wanted = pillarsIn.length ? pillarsIn : DEFAULT_PILLARS;
    for (const p of wanted) {
      const existing = await prisma.pillar.findFirst({
        where: { brandId: brand.id, name: p },
        select: { id: true },
      });
      if (!existing) {
        await prisma.pillar.create({
          data: {
            brandId: brand.id,
            name: p,
            desc: "", // <- fixes NOT NULL desc constraint
          },
        });
      }
    }

    // Ensure default posting windows
    for (const plat of PLATFORMS) {
      await prisma.window.upsert({
        where: { brandId_platform: { brandId: brand.id, platform: plat } },
        update: {},
        create: {
          brandId: brand.id,
          platform: plat,
          start: "09:30",
          end: "11:00",
          tz: "UTC",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      brand: { id: brand.id, name: brand.name },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}