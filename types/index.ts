import { Role, DeviceStatus } from "@prisma/client";

export type { Role, DeviceStatus };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePass: boolean;
}

export const STATUS_LABELS: Record<DeviceStatus, string> = {
  received: "Παραλήφθηκε",
  inspecting: "Υπό Εξέταση",
  repairing: "Υπό Επισκευή",
  awaiting_delivery: "Αναμονή Παράδοσης",
  archived: "Αρχείο",
};

export const STATUS_COLORS: Record<DeviceStatus, string> = {
  received: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  inspecting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  repairing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  awaiting_delivery: "bg-green-500/10 text-green-400 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  technician: "Technician",
};

export const DEVICE_BRANDS = [
  "Apple",
  "Samsung",
  "Huawei",
  "Xiaomi",
  "Sony",
  "LG",
  "Motorola",
  "Nokia",
  "OnePlus",
  "Oppo",
  "Vivo",
  "Realme",
  "Asus",
  "HP",
  "Dell",
  "Lenovo",
  "Acer",
  "Toshiba",
  "Microsoft",
  "Other",
];
