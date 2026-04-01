import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.deviceMessage.findMany({
    where: { deviceId: params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

const createSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const message = await prisma.deviceMessage.create({
    data: {
      deviceId: params.id,
      userId: session.user.id,
      content: parsed.data.content,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
