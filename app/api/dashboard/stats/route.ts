import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [statusCounts, recentActivity, weeklyData, recentDevices] = await Promise.all([
    // Count by status
    prisma.device.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Last 10 history entries
    prisma.deviceHistory.findMany({
      take: 10,
      orderBy: { changedAt: "desc" },
      include: {
        device: { select: { id: true, ticketId: true, customerName: true } },
        user: { select: { name: true } },
      },
    }),

    // Last 7 days new devices
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'DD/MM') as day,
        COUNT(*) as count
      FROM devices
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `,

    // Last 8 devices (exclude archived)
    prisma.device.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      where: { status: { not: "archived" } },
      select: {
        id: true,
        ticketId: true,
        customerName: true,
        brand: true,
        model: true,
        status: true,
        createdAt: true,
        repairCost: true,
        technician: { select: { name: true } },
      },
    }),
  ]);

  const counts: Record<string, number> = {
    received: 0,
    inspecting: 0,
    repairing: 0,
    awaiting_delivery: 0,
    archived: 0,
  };
  for (const row of statusCounts) {
    counts[row.status] = row._count.id;
  }

  const weekly = weeklyData.map((r) => ({
    day: r.day,
    count: Number(r.count),
  }));

  return NextResponse.json({
    counts,
    recentActivity,
    weekly,
    recentDevices,
  });
}
