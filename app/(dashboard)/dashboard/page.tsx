"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus, Search, Loader2, ArrowRight, Eye,
  Wrench, Truck, Activity,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Charts } from "@/components/dashboard/Charts";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { formatDate, formatDateTime, formatCurrency, cn } from "@/lib/utils";

const STATUS_GRADIENT: Record<DeviceStatus, string> = {
  received: "from-blue-500/10 to-transparent",
  inspecting: "from-yellow-500/10 to-transparent",
  repairing: "from-orange-500/10 to-transparent",
  awaiting_delivery: "from-green-500/10 to-transparent",
  archived: "from-gray-500/10 to-transparent",
};

interface RecentDevice {
  id: string;
  ticketId: string;
  customerName: string;
  brand: string;
  model: string;
  status: DeviceStatus;
  createdAt: string;
  repairCost: number | null;
  technician: { name: string } | null;
}

interface ActivityItem {
  id: string;
  oldStatus: string | null;
  newStatus: string | null;
  changedAt: string;
  note: string | null;
  device: { id: string; ticketId: string; customerName: string } | null;
  user: { name: string } | null;
}

interface StatsData {
  counts: Partial<Record<DeviceStatus, number>>;
  recentActivity: ActivityItem[];
  weekly: { day: string; count: number }[];
  recentDevices: RecentDevice[];
}

const metricConfig = [
  {
    key: "received" as const,
    label: "Παραλήφθηκε",
    description: "Συσκευές σε αναμονή",
    icon: <Activity className="h-5 w-5" />,
    valueClass: "text-blue-400",
    gradient: "from-blue-500/10 to-transparent",
    iconClass: "text-blue-400",
  },
  {
    key: "inspecting" as const,
    label: "Υπό Εξέταση",
    description: "Σε φάση διάγνωσης",
    icon: <Search className="h-5 w-5" />,
    valueClass: "text-yellow-400",
    gradient: "from-yellow-500/10 to-transparent",
    iconClass: "text-yellow-400",
  },
  {
    key: "repairing" as const,
    label: "Υπό Επισκευή",
    description: "Ενεργές εργασίες επισκευής",
    icon: <Wrench className="h-5 w-5" />,
    valueClass: "text-orange-400",
    gradient: "from-orange-500/10 to-transparent",
    iconClass: "text-orange-400",
  },
  {
    key: "awaiting_delivery" as const,
    label: "Αναμονή Παράδοσης",
    description: "Έτοιμες για παράδοση",
    icon: <Truck className="h-5 w-5" />,
    valueClass: "text-emerald-400",
    gradient: "from-emerald-500/10 to-transparent",
    iconClass: "text-emerald-400",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/devices?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const canSeeCharts = role === "admin" || role === "manager";

  function getMetricValue(key: string): number {
    if (!stats) return 0;
    return stats.counts[key as DeviceStatus] ?? 0;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Πίνακας Ελέγχου</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Καλώς ήρθατε, {session?.user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="TRM-XXXX ή όνομα..."
              className="pl-9 w-48 sm:w-56 bg-background border-border"
            />
          </form>
          <Button
            onClick={() => router.push("/devices?new=1")}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Νέα Συσκευή
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricConfig.map((m) => (
              <motion.div
                key={m.key}
                className="relative bg-muted/50 border border-border/50 rounded-xl p-4 overflow-hidden"
                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} pointer-events-none`} />
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                    <p className={cn("text-3xl font-bold mt-1", m.valueClass)}>
                      {getMetricValue(m.key)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{m.description}</p>
                  </div>
                  <div className={cn("shrink-0 mt-0.5", m.iconClass)}>{m.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom: Devices + Activity */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

              {/* Recent Devices */}
              <div className="lg:col-span-4 relative border border-border/30 rounded-2xl p-5 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-sm font-semibold text-foreground">Πρόσφατες Συσκευές</h2>
                  </div>
                  <Link href="/devices">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">Όλες →</Button>
                  </Link>
                </div>

                {stats.recentDevices.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Δεν υπάρχουν συσκευές</p>
                ) : (
                  <motion.div
                    className="space-y-2"
                    variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                    initial="hidden"
                    animate="visible"
                  >
                    {stats.recentDevices.map((device) => (
                      <motion.div
                        key={device.id}
                        variants={{
                          hidden: { opacity: 0, x: -16, filter: "blur(4px)" },
                          visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
                        }}
                      >
                        <Link href={`/devices/${device.id}`}>
                          <motion.div
                            className="relative bg-muted/50 border border-border/50 rounded-xl px-4 py-3 overflow-hidden group"
                            whileHover={{ y: -1, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-l ${STATUS_GRADIENT[device.status]} pointer-events-none`}
                              style={{ backgroundSize: "25% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
                            />
                            <div className="relative flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-primary">{device.ticketId}</span>
                                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[device.status])}>
                                    {STATUS_LABELS[device.status]}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-foreground truncate mt-0.5">{device.customerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {device.brand} {device.model}{device.technician && ` · ${device.technician.name}`}
                                </p>
                                {device.repairCost != null && (
                                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 mt-0.5">
                                    {formatCurrency(Number(device.repairCost))}
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">{formatDate(device.createdAt)}</p>
                                <Eye className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground mt-1 ml-auto transition-colors" />
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Εμφανίζονται οι 8 πιο πρόσφατες συσκευές.</p>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-3 relative border border-border/30 rounded-2xl p-5 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-semibold text-foreground">Πρόσφατη Δραστηριότητα</h2>
                </div>

                {stats.recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Δεν υπάρχει δραστηριότητα</p>
                ) : (
                  <motion.ul
                    className="space-y-2"
                    variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                    initial="hidden"
                    animate="visible"
                  >
                    {stats.recentActivity.map((item) => (
                      <motion.li
                        key={item.id}
                        variants={{
                          hidden: { opacity: 0, x: -16, filter: "blur(4px)" },
                          visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
                        }}
                      >
                        <motion.div
                          className="relative bg-muted/50 border border-border/50 rounded-xl px-4 py-3 overflow-hidden"
                          whileHover={{ y: -1, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                        >
                          {item.newStatus && (
                            <div
                              className={`absolute inset-0 bg-gradient-to-l ${STATUS_GRADIENT[item.newStatus as DeviceStatus] ?? "from-primary/5 to-transparent"} pointer-events-none`}
                              style={{ backgroundSize: "20% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
                            />
                          )}
                          <div className="relative flex gap-3 text-sm">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-foreground text-xs">{item.user?.name ?? "—"}</span>
                                {item.device && (
                                  <Link href={`/devices/${item.device.id}`} className="font-mono text-xs text-primary hover:underline">
                                    {item.device.ticketId}
                                  </Link>
                                )}
                              </div>

                              {item.oldStatus && item.newStatus && (
                                <div className="mt-1 flex items-center gap-1 flex-wrap">
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[item.oldStatus as DeviceStatus] ?? "")}>
                                    {STATUS_LABELS[item.oldStatus as DeviceStatus] ?? item.oldStatus}
                                  </Badge>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[item.newStatus as DeviceStatus] ?? "")}>
                                    {STATUS_LABELS[item.newStatus as DeviceStatus] ?? item.newStatus}
                                  </Badge>
                                </div>
                              )}

                              {!item.oldStatus && item.newStatus && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-[10px] text-muted-foreground">Εισήχθη ως</span>
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[item.newStatus as DeviceStatus] ?? "")}>
                                    {STATUS_LABELS[item.newStatus as DeviceStatus] ?? item.newStatus}
                                  </Badge>
                                </div>
                              )}

                              <p className="mt-1 text-[11px] text-muted-foreground/60">{formatDateTime(item.changedAt)}</p>
                            </div>
                          </div>
                        </motion.div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </div>
            </div>
          )}

          {/* Charts — admin + manager only, below device list */}
          {canSeeCharts && stats && (
            <Charts weekly={stats.weekly} counts={stats.counts} />
          )}
        </>
      )}
    </div>
  );
}
