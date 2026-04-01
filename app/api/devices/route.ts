import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTicketId } from "@/lib/ticket";
import { DeviceStatus, Prisma } from "@prisma/client";
import { z } from "zod";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as DeviceStatus | null;
  const technicianId = searchParams.get("technician") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sortField = searchParams.get("sort") ?? "createdAt";
  const sortDir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";

  const allowedSorts: Record<string, string> = {
    ticketId: "ticketId",
    customerName: "customerName",
    brand: "brand",
    status: "status",
    createdAt: "createdAt",
    estimatedDate: "estimatedDate",
  };
  const orderField = allowedSorts[sortField] ?? "createdAt";

  const hasActiveFilter = q || status || technicianId || dateFrom || dateTo;

  const where: Prisma.DeviceWhereInput = {
    AND: [
      !hasActiveFilter ? { status: { not: "archived" as DeviceStatus } } : {},
      q
        ? {
            OR: [
              { ticketId: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      technicianId ? { technicianId } : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: new Date(dateTo + "T23:59:59") } } : {},
    ],
  };

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        technician: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.device.count({ where }),
  ]);

  return NextResponse.json({
    devices,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    pageSize: PAGE_SIZE,
  });
}

const createSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional(),
  issueDesc: z.string().min(1),
  estimatedDate: z.string().optional(),
  repairCost: z.number().optional(),
  technicianId: z.string().uuid().optional().or(z.literal("")),
  warranty: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const ticketId = await generateTicketId();

  const device = await prisma.device.create({
    data: {
      ticketId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber || null,
      issueDesc: data.issueDesc,
      estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
      repairCost: data.repairCost ?? null,
      technicianId: data.technicianId || null,
      warranty: data.warranty ?? false,
      notes: data.notes || null,
      createdBy: session.user.id,
      status: "received",
    },
  });

  // Log history
  await prisma.deviceHistory.create({
    data: {
      deviceId: device.id,
      changedBy: session.user.id,
      oldStatus: null,
      newStatus: "received",
      note: "Συσκευή παραλήφθηκε",
    },
  });

  return NextResponse.json(device, { status: 201 });
}
