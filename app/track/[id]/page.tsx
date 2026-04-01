"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, PackageCheck, Wrench, Search, Truck, Archive, CheckCircle2,
} from "lucide-react";
import { DeviceStatus } from "@/types";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { useAppSettings } from "@/lib/app-settings-context";

const STATUS_LABELS: Record<DeviceStatus, string> = {
  received: "Παραλήφθηκε",
  inspecting: "Υπό Εξέταση",
  repairing: "Υπό Επισκευή",
  awaiting_delivery: "Έτοιμο για Παράδοση",
  archived: "Ολοκληρώθηκε",
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
  received: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  inspecting: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  repairing: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  awaiting_delivery: "text-green-400 border-green-500/30 bg-green-500/10",
  archived: "text-gray-400 border-gray-500/30 bg-gray-500/10",
};

const STATUS_GRADIENT: Record<DeviceStatus, string> = {
  received: "from-blue-500/10 to-transparent",
  inspecting: "from-yellow-500/10 to-transparent",
  repairing: "from-orange-500/10 to-transparent",
  awaiting_delivery: "from-green-500/10 to-transparent",
  archived: "from-gray-500/10 to-transparent",
};

const STATUS_ICONS: Record<DeviceStatus, React.ReactNode> = {
  received: <PackageCheck className="h-4 w-4" />,
  inspecting: <Search className="h-4 w-4" />,
  repairing: <Wrench className="h-4 w-4" />,
  awaiting_delivery: <Truck className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
};

const ORDERED_STATUSES: DeviceStatus[] = [
  "received",
  "inspecting",
  "repairing",
  "awaiting_delivery",
  "archived",
];

interface HistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string | null;
  changedAt: string;
  note: string | null;
}

interface DeviceData {
  id: string;
  ticketId: string;
  brand: string;
  model: string;
  status: DeviceStatus;
  issueDesc: string;
  estimatedDate: string | null;
  createdAt: string;
  history: HistoryEntry[];
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const { shopName } = useAppSettings();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/track/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setDevice(d); })
      .finally(() => setLoading(false));
  }, [id]);

  const currentIndex = device ? ORDERED_STATUSES.indexOf(device.status) : -1;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{shopName}</p>
        <h1 className="text-2xl font-bold text-foreground">Παρακολούθηση Επισκευής</h1>
        <p className="text-sm text-muted-foreground mt-1">Ελέγξτε την κατάσταση της συσκευής σας</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Φόρτωση...</span>
        </div>
      ) : notFound ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg relative bg-muted/50 border border-border/50 rounded-2xl p-10 overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-foreground">Δεν βρέθηκε</p>
          <p className="text-sm text-muted-foreground mt-1">Το ticket δεν υπάρχει ή ο σύνδεσμος είναι λανθασμένος.</p>
        </motion.div>
      ) : device && (
        <motion.div
          className="w-full max-w-lg space-y-3"
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
        >
          {/* Device card */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
            }}
            className="relative bg-muted/50 border border-border/50 rounded-xl p-5 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-l ${STATUS_GRADIENT[device.status]} pointer-events-none`}
              style={{ backgroundSize: "30% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold text-primary">{device.ticketId}</p>
                <p className="text-base font-semibold text-foreground mt-0.5">{device.brand} {device.model}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Εισήχθη: {formatDate(device.createdAt)}</p>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0",
                STATUS_COLORS[device.status]
              )}>
                {STATUS_ICONS[device.status]}
                {STATUS_LABELS[device.status]}
              </span>
            </div>

            {device.issueDesc && (
              <div className="relative mt-4 border-t border-border/50 pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Πρόβλημα</p>
                <p className="text-sm text-foreground">{device.issueDesc}</p>
              </div>
            )}

            {device.estimatedDate && (
              <div className="relative mt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Εκτιμώμενη Παράδοση</p>
                <p className="text-sm font-medium text-emerald-400">{formatDate(device.estimatedDate)}</p>
              </div>
            )}
          </motion.div>

          {/* Progress stepper */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
            }}
            className="relative bg-muted/50 border border-border/50 rounded-xl p-5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <p className="relative text-xs text-muted-foreground uppercase tracking-wide font-medium mb-5">Πορεία Επισκευής</p>
            <div className="relative space-y-0">
              {ORDERED_STATUSES.map((s, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                const isLast = i === ORDERED_STATUSES.length - 1;

                return (
                  <div key={s} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent
                          ? `border-current ${STATUS_COLORS[s]} scale-110`
                          : "border-border/40 bg-muted/30 text-muted-foreground/20"
                      )}>
                        {isDone
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : isCurrent
                          ? <span className="h-2 w-2 rounded-full bg-current" />
                          : <span className="h-1.5 w-1.5 rounded-full bg-border/40" />
                        }
                      </div>
                      {!isLast && (
                        <div className={cn(
                          "w-0.5 flex-1 my-1",
                          i < currentIndex ? "bg-primary" : "bg-border/30"
                        )} style={{ minHeight: "20px" }} />
                      )}
                    </div>
                    <div className={cn("pb-5", isLast && "pb-0")}>
                      <p className={cn(
                        "text-sm font-medium leading-7",
                        isDone
                          ? "text-muted-foreground/50 line-through"
                          : isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      )}>
                        {STATUS_LABELS[s]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* History timeline */}
          {device.history.length > 0 && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
              }}
              className="relative bg-muted/50 border border-border/50 rounded-xl p-5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <p className="relative text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">Ιστορικό</p>
              <div className="relative space-y-3">
                {device.history.map((h) => (
                  <div key={h.id} className="relative bg-background/40 border border-border/30 rounded-lg px-3 py-2.5">
                    {h.newStatus && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <p className="text-sm font-medium text-foreground">
                          {STATUS_LABELS[h.newStatus as DeviceStatus] ?? h.newStatus}
                        </p>
                      </div>
                    )}
                    {h.note && (
                      <p className="text-xs text-muted-foreground mt-1 ml-3.5">{h.note}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/50 mt-1 ml-3.5">{formatDateTime(h.changedAt)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <p className="text-center text-xs text-muted-foreground pb-4">
            Αυτή η σελίδα ανανεώνεται χειροκίνητα · {shopName}
          </p>
        </motion.div>
      )}
    </div>
  );
}
