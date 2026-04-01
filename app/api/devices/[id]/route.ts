import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { unlink } from "fs/promises";
import path from "path";

async function deletePhotoFile(url: string) {
  try {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath);
  } catch {
    // Dosya zaten yoksa sessizce geç
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const device = await prisma.device.findUnique({
    where: { id: params.id },
    include: {
      technician: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      history: {
        orderBy: { changedAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(device);
}

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  customerEmail: z.string().optional().nullable(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  serialNumber: z.string().optional().nullable(),
  issueDesc: z.string().min(1).optional(),
  estimatedDate: z.string().optional().nullable(),
  repairCost: z.number().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  warranty: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Fotoğraf güncellemesinde silinen dosyaları diskten kaldır
  if (data.photos !== undefined) {
    const existing = await prisma.device.findUnique({
      where: { id: params.id },
      select: { photos: true },
    });
    const removed = (existing?.photos ?? []).filter((p) => !data.photos!.includes(p));
    await Promise.all(removed.map(deletePhotoFile));
  }

  const device = await prisma.device.update({
    where: { id: params.id },
    data: {
      ...(data.customerName !== undefined && { customerName: data.customerName }),
      ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone }),
      ...(data.customerEmail !== undefined && { customerEmail: data.customerEmail || null }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber || null }),
      ...(data.issueDesc !== undefined && { issueDesc: data.issueDesc }),
      ...(data.estimatedDate !== undefined && {
        estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
      }),
      ...(data.repairCost !== undefined && { repairCost: data.repairCost }),
      ...(data.technicianId !== undefined && { technicianId: data.technicianId || null }),
      ...(data.warranty !== undefined && { warranty: data.warranty }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.photos !== undefined && { photos: data.photos }),
    },
    include: {
      technician: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      history: {
        orderBy: { changedAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(device);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const device = await prisma.device.findUnique({
    where: { id: params.id },
    select: { photos: true },
  });
  await Promise.all((device?.photos ?? []).map(deletePhotoFile));
  await prisma.device.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
