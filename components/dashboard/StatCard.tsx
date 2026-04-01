"use client";

import { Inbox, Search, Wrench, Truck, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DeviceStatus, STATUS_LABELS } from "@/types";

const statusConfig: Record<
  DeviceStatus,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  received: {
    icon: Inbox,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  inspecting: {
    icon: Search,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  repairing: {
    icon: Wrench,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  awaiting_delivery: {
    icon: Truck,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  archived: {
    icon: Archive,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
  },
};

interface StatCardProps {
  status: DeviceStatus;
  count: number;
  active: boolean;
  onClick: () => void;
}

export function StatCard({ status, count, active, onClick }: StatCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button onClick={onClick} className="w-full text-left">
      <Card
        className={cn(
          "p-5 transition-all duration-200 hover:scale-[1.02] cursor-pointer border",
          active
            ? `${config.bg} ${config.border} ring-1 ring-inset ${config.border}`
            : "border-border hover:border-muted-foreground/30"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {STATUS_LABELS[status]}
            </p>
            <p className={cn("mt-2 text-3xl font-bold", config.color)}>
              {count}
            </p>
          </div>
          <div className={cn("rounded-xl p-2.5", config.bg, "border", config.border)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
        </div>
      </Card>
    </button>
  );
}
