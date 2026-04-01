import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.systemSettings.findMany({
    where: { key: { in: ["shop_name", "shop_logo"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    shopName: map.shop_name ?? "RepairTrack",
    logoUrl: map.shop_logo ?? null,
  });
}
