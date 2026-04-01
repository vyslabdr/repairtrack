import { prisma } from "@/lib/prisma";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateTicketId(): Promise<string> {
  let ticketId: string;
  let exists = true;

  do {
    ticketId = `TRM-${generateCode(4)}`;
    const existing = await prisma.device.findUnique({ where: { ticketId } });
    exists = !!existing;
  } while (exists);

  return ticketId;
}
