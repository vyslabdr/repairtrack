import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeviceStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["received", "inspecting", "repairing", "awaiting_delivery", "archived"]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const device = await prisma.device.findUnique({ where: { id: params.id } });
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.device.update({
    where: { id: params.id },
    data: { status: parsed.data.status as DeviceStatus },
  });

  await prisma.deviceHistory.create({
    data: {
      deviceId: device.id,
      changedBy: session.user.id,
      oldStatus: device.status,
      newStatus: parsed.data.status,
      note: parsed.data.note ?? null,
    },
  });

  return NextResponse.json(updated);
}
