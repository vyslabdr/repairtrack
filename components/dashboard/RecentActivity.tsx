"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
  oldStatus: string | null;
  newStatus: string | null;
  changedAt: string;
  note: string | null;
  device: { id: string; ticketId: string; customerName: string } | null;
  user: { name: string } | null;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Πρόσφατη Δραστηριότητα
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Δεν υπάρχει δραστηριότητα
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                {/* Dot */}
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.device && (
                      <Link
                        href={`/devices/${item.device.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.device.ticketId}
                      </Link>
                    )}
                    <span className="text-muted-foreground truncate">
                      {item.device?.customerName}
                    </span>
                  </div>

                  {/* Status change */}
                  {item.oldStatus && item.newStatus && (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          STATUS_COLORS[item.oldStatus as DeviceStatus] ?? ""
                        }`}
                      >
                        {STATUS_LABELS[item.oldStatus as DeviceStatus] ?? item.oldStatus}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          STATUS_COLORS[item.newStatus as DeviceStatus] ?? ""
                        }`}
                      >
                        {STATUS_LABELS[item.newStatus as DeviceStatus] ?? item.newStatus}
                      </Badge>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.user?.name ?? "—"}</span>
                    <span>·</span>
                    <span>{formatDateTime(item.changedAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
