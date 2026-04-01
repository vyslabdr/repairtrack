import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Prisma.DeviceWhereInput = {
    ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
    ...(dateTo && { createdAt: { lte: new Date(dateTo + "T23:59:59") } }),
  };

  const [
    totalDevices,
    statusCounts,
    technicianLoad,
    avgRepairTime,
    dailyTrend,
  ] = await Promise.all([
    prisma.device.count({ where }),

    prisma.device.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),

    prisma.device.groupBy({
      by: ["technicianId"],
      where: { ...where, technicianId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    // Avg days from received → archived
    prisma.$queryRaw<{ avg_days: number }[]>`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 1) as avg_days
      FROM devices
      WHERE status = 'archived'
      ${dateFrom ? Prisma.sql`AND created_at >= ${new Date(dateFrom)}` : Prisma.empty}
      ${dateTo ? Prisma.sql`AND created_at <= ${new Date(dateTo + "T23:59:59")}` : Prisma.empty}
    `,

    // Daily new devices (last 30 days or date range)
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'DD/MM') as day, COUNT(*) as count
      FROM devices
      WHERE created_at >= ${dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      ${dateTo ? Prisma.sql`AND created_at <= ${new Date(dateTo + "T23:59:59")}` : Prisma.empty}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `,
  ]);

  // Resolve technician names
  const techIds = technicianLoad.map(t => t.technicianId!);
  const techs = techIds.length
    ? await prisma.user.findMany({
        where: { id: { in: techIds } },
        select: { id: true, name: true },
      })
    : [];
  const techMap = Object.fromEntries(techs.map(t => [t.id, t.name]));

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) statusMap[s.status] = s._count.id;

  return NextResponse.json({
    totalDevices,
    statusMap,
    technicianLoad: technicianLoad.map(t => ({
      name: techMap[t.technicianId!] ?? "—",
      count: t._count.id,
    })),
    avgRepairDays: avgRepairTime[0]?.avg_days ?? 0,
    dailyTrend: dailyTrend.map(d => ({ day: d.day, count: Number(d.count) })),
  });
}
