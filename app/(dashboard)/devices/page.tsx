"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Eye, Loader2, Filter, X,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/devices/StatusBadge";
import { NewDeviceModal } from "@/components/modals/NewDeviceModal";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { formatDate, cn } from "@/lib/utils";

interface Device {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  status: DeviceStatus;
  createdAt: string;
  estimatedDate: string | null;
  technician: { id: string; name: string } | null;
}

interface ListResponse {
  devices: Device[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_GRADIENT: Record<DeviceStatus, string> = {
  received: "from-blue-500/10 to-transparent",
  inspecting: "from-yellow-500/10 to-transparent",
  repairing: "from-orange-500/10 to-transparent",
  awaiting_delivery: "from-green-500/10 to-transparent",
  archived: "from-gray-500/10 to-transparent",
};

function DevicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get("page") ?? "1");
  const q = searchParams.get("q") ?? "";
  const status = (searchParams.get("status") ?? "") as DeviceStatus | "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const dir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const [searchInput, setSearchInput] = useState(q);

  function setParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    router.push(`/devices?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/devices?${params.toString()}`);
  }

  function toggleSort(field: string) {
    if (sort === field) setParams({ sort: field, dir: dir === "asc" ? "desc" : "asc" });
    else setParams({ sort: field, dir: "desc" });
  }

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    const res = await fetch(`/api/devices?${params.toString()}`);
    setData(await res.json());
    setLoading(false);
  }, [searchParams]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);
  useEffect(() => {
    if (searchParams.get("new") === "1") setModalOpen(true);
  }, [searchParams]);

  function SortIcon({ field }: { field: string }) {
    if (sort !== field) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return dir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  function ThBtn({ field, children }: { field: string; children: React.ReactNode }) {
    return (
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap">
        {children}<SortIcon field={field} />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Συσκευές</h1>
          {data && <p className="text-sm text-muted-foreground mt-0.5">{data.total} εγγραφές</p>}
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setParams({ q: searchInput }); }} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Αναζήτηση..." className="pl-9 w-44 sm:w-52 bg-background border-border" />
          </form>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={cn("border-border shrink-0", showFilters && "bg-primary/10 border-primary/30 text-primary")}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Νέα Συσκευή</span>
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border-border/50 p-4 bg-card rounded-xl">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Κατάσταση</label>
                  <select value={status} onChange={(e) => setParams({ status: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Όλες</option>
                    {(Object.keys(STATUS_LABELS) as DeviceStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Από</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setParams({ dateFrom: e.target.value })} className="bg-background border-border h-9 text-sm w-36" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Έως</label>
                  <Input type="date" value={dateTo} onChange={(e) => setParams({ dateTo: e.target.value })} className="bg-background border-border h-9 text-sm w-36" />
                </div>
                {(status || dateFrom || dateTo || q) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); router.push("/devices"); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4 mr-1" />Καθαρισμός
                  </Button>
                )}
              </div>
              {(status || q) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {status && (
                    <Badge variant="outline" className={cn("text-xs gap-1", STATUS_COLORS[status as DeviceStatus])}>
                      {STATUS_LABELS[status as DeviceStatus]}
                      <button onClick={() => setParams({ status: "" })}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {q && (
                    <Badge variant="outline" className="text-xs gap-1 border-border text-muted-foreground">
                      &quot;{q}&quot;
                      <button onClick={() => { setSearchInput(""); setParams({ q: "" }); }}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data || data.devices.length === 0 ? (
        <div className="relative border border-border/30 rounded-2xl p-12 bg-card text-center">
          <p className="text-muted-foreground">Δεν βρέθηκαν συσκευές</p>
          <Button onClick={() => setModalOpen(true)} className="mt-4 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1.5" />Πρώτη Καταχώρηση
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="relative border border-border/30 rounded-2xl p-6 bg-card">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <div className="col-span-2"><ThBtn field="ticketId">Ticket</ThBtn></div>
                <div className="col-span-3"><ThBtn field="customerName">Πελάτης</ThBtn></div>
                <div className="col-span-2"><ThBtn field="brand">Συσκευή</ThBtn></div>
                <div className="col-span-2"><ThBtn field="status">Κατάσταση</ThBtn></div>
                <div className="col-span-2">Τεχνικός</div>
                <div className="col-span-1 text-right"><ThBtn field="createdAt">Ημερ.</ThBtn></div>
              </div>

              {/* Rows */}
              <motion.div
                className="space-y-2"
                variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                initial="hidden"
                animate="visible"
              >
                {data.devices.map((device) => (
                  <motion.div
                    key={device.id}
                    variants={{
                      hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
                      visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
                    }}
                  >
                    <motion.div
                      className="relative bg-muted/50 border border-border/50 rounded-xl p-4 overflow-hidden"
                      whileHover={{ y: -1, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    >
                      {/* Status gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-l ${STATUS_GRADIENT[device.status]} pointer-events-none`}
                        style={{ backgroundSize: "25% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
                      />

                      <div className="relative grid grid-cols-12 gap-4 items-center">
                        {/* Ticket */}
                        <div className="col-span-2">
                          <span className="font-mono text-sm font-bold text-primary">{device.ticketId}</span>
                        </div>

                        {/* Customer */}
                        <div className="col-span-3">
                          <div className="font-medium text-foreground text-sm truncate">{device.customerName}</div>
                          <div className="text-xs text-muted-foreground">{device.customerPhone}</div>
                        </div>

                        {/* Device */}
                        <div className="col-span-2">
                          <div className="text-sm text-foreground">{device.brand}</div>
                          <div className="text-xs text-muted-foreground">{device.model}</div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <StatusBadge
                            deviceId={device.id}
                            status={device.status}
                            onUpdated={(s) =>
                              setData((prev) => prev ? {
                                ...prev,
                                devices: prev.devices.map((d) => d.id === device.id ? { ...d, status: s } : d),
                              } : prev)
                            }
                          />
                        </div>

                        {/* Technician */}
                        <div className="col-span-2">
                          <span className="text-sm text-muted-foreground">{device.technician?.name ?? "—"}</span>
                        </div>

                        {/* Date + View */}
                        <div className="col-span-1 flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(device.createdAt)}</span>
                          <Link href={`/devices/${device.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {data.devices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 28 }}
              >
                <Link href={`/devices/${device.id}`}>
                  <div className="relative bg-muted/50 border border-border/50 rounded-xl p-4 overflow-hidden active:scale-[0.99] transition-transform">
                    <div className={`absolute inset-0 bg-gradient-to-l ${STATUS_GRADIENT[device.status]} pointer-events-none`} style={{ backgroundSize: "30% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }} />
                    <div className="relative flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-primary font-bold text-sm">{device.ticketId}</span>
                          <StatusBadge deviceId={device.id} status={device.status} readonly />
                        </div>
                        <p className="font-medium text-foreground mt-1 truncate">{device.customerName}</p>
                        <p className="text-xs text-muted-foreground">{device.brand} {device.model}</p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    <div className="relative mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(device.createdAt)}</span>
                      {device.technician && <span>· {device.technician.name}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} από {data.total}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 w-8 border-border">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 font-medium text-foreground">{page} / {data.totalPages}</span>
                <Button variant="outline" size="icon" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="h-8 w-8 border-border">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <NewDeviceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); if (searchParams.get("new") === "1") router.push("/devices"); }}
        onSuccess={fetchDevices}
      />
    </div>
  );
}

export default function DevicesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DevicesPage />
    </Suspense>
  );
}
