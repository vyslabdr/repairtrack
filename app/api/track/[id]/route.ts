import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const where = UUID_RE.test(id)
    ? { OR: [{ ticketId: id }, { id }] }
    : { ticketId: id };

  const device = await prisma.device.findFirst({
    where,
    select: {
      id: true,
      ticketId: true,
      brand: true,
      model: true,
      status: true,
      issueDesc: true,
      estimatedDate: true,
      createdAt: true,
      history: {
        orderBy: { changedAt: "asc" },
        select: {
          id: true,
          oldStatus: true,
          newStatus: true,
          changedAt: true,
          note: true,
        },
      },
    },
  });

  if (!device) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(device);
}
