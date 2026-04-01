"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Edit, Trash2, Printer, Loader2, ArrowRight,
  Phone, Mail, Cpu, Hash, ShieldCheck, CalendarDays,
  Wrench, DollarSign, Clock, ImagePlus, X, ZoomIn,
  User, Tag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/devices/StatusBadge";
import { DeviceChat } from "@/components/devices/DeviceChat";
import { EditDeviceModal } from "@/components/modals/EditDeviceModal";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { formatDate, formatDateTime, formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_ACCENT: Record<DeviceStatus, string> = {
  received:          "from-blue-500/10 via-transparent",
  inspecting:        "from-yellow-500/10 via-transparent",
  repairing:         "from-orange-500/10 via-transparent",
  awaiting_delivery: "from-green-500/10 via-transparent",
  archived:          "from-gray-500/10 via-transparent",
};

const STATUS_RING: Record<DeviceStatus, string> = {
  received:          "border-blue-500/20",
  inspecting:        "border-yellow-500/20",
  repairing:         "border-orange-500/20",
  awaiting_delivery: "border-green-500/20",
  archived:          "border-gray-500/20",
};

interface HistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string | null;
  note: string | null;
  changedAt: string;
  user: { id: string; name: string } | null;
}

interface Device {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  brand: string;
  model: string;
  serialNumber?: string | null;
  issueDesc: string;
  status: DeviceStatus;
  warranty: boolean;
  estimatedDate?: string | null;
  repairCost?: number | null;
  notes?: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  technicianId?: string | null;
  technician?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
  history: HistoryEntry[];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin";

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/devices/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setDevice)
      .catch(() => toast.error("Συσκευή δεν βρέθηκε"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePhotoUpload(files: FileList) {
    if (!device) return;
    if (device.photos.length + files.length > 5) {
      toast.error("Μέγιστο 5 φωτογραφίες"); return;
    }
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("deviceId", device.id);
      const res = await fetch("/api/upload/photo", { method: "POST", body: form });
      if (res.ok) { const { url } = await res.json(); uploaded.push(url); }
      else toast.error(`Σφάλμα ανεβάσματος: ${file.name}`);
    }
    if (uploaded.length > 0) {
      const newPhotos = [...device.photos, ...uploaded];
      const res = await fetch(`/api/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: newPhotos }),
      });
      if (res.ok) {
        setDevice(prev => prev ? { ...prev, photos: newPhotos } : prev);
        toast.success(`${uploaded.length} φωτογραφία/ες ανέβηκαν`);
      }
    }
    setUploading(false);
  }

  async function handlePhotoDelete(url: string) {
    if (!device) return;
    const newPhotos = device.photos.filter(p => p !== url);
    const res = await fetch(`/api/devices/${device.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: newPhotos }),
    });
    if (res.ok) {
      setDevice(prev => prev ? { ...prev, photos: newPhotos } : prev);
      setLightbox(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συσκευή;")) return;
    setDeleting(true);
    const res = await fetch(`/api/devices/${device!.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Η συσκευή διαγράφηκε");
      router.push("/devices");
    } else {
      toast.error("Σφάλμα διαγραφής");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground">Η συσκευή δεν βρέθηκε</p>
        <Link href="/devices"><Button className="mt-4 bg-primary">Επιστροφή</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Hero banner ── */}
      <div className={cn(
        "relative rounded-2xl border overflow-hidden",
        STATUS_RING[device.status]
      )}>
        {/* gradient glow from status color */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none",
          STATUS_ACCENT[device.status]
        )} />

        <div className="relative px-5 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Link href="/devices">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-2xl font-bold text-primary tracking-wide">
                  {device.ticketId}
                </span>
                <StatusBadge
                  deviceId={device.id}
                  status={device.status}
                  onUpdated={s => setDevice(prev => prev ? { ...prev, status: s } : prev)}
                />
                {device.warranty && (
                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-xs gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Εγγύηση
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {device.brand} {device.model}
                <span className="mx-1.5 text-muted-foreground/30">·</span>
                Καταχωρήθηκε {formatDateTime(device.createdAt)}
                {device.creator && (
                  <span> από <span className="text-foreground/70">{device.creator.name}</span></span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/8 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Εκτύπωση
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Επεξεργασία
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Διαγραφή
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer card */}
          <div className="rounded-2xl border border-[#2E3347] bg-[#13151f] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#2E3347]">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                <User className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-foreground">Στοιχεία Πελάτη</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                  {initials(device.customerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-base leading-tight">{device.customerName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    <a href={`tel:${device.customerPhone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-3 w-3" />
                      {device.customerPhone}
                    </a>
                    {device.customerEmail && (
                      <a href={`mailto:${device.customerEmail}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="h-3 w-3" />
                        {device.customerEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device + Service combined */}
          <div className="rounded-2xl border border-[#2E3347] bg-[#13151f] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#2E3347]">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
                <Cpu className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <span className="text-sm font-semibold text-foreground">Συσκευή & Σέρβις</span>
            </div>

            <div className="p-5 space-y-5">
              {/* Device specs row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Chip icon={Tag} label="Μάρκα" value={device.brand} />
                <Chip icon={Cpu} label="Μοντέλο" value={device.model} />
                {device.serialNumber && (
                  <Chip icon={Hash} label="Σειριακός" value={device.serialNumber} />
                )}
                <Chip
                  icon={ShieldCheck}
                  label="Εγγύηση"
                  value={device.warranty ? "Ναι" : "Όχι"}
                  valueClass={device.warranty ? "text-green-400" : "text-muted-foreground"}
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-[#2E3347]" />

              {/* Issue description */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Wrench className="h-3 w-3" />
                  Περιγραφή Βλάβης
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-[#0F1117] rounded-xl px-4 py-3 border border-[#2E3347]/60">
                  {device.issueDesc}
                </p>
              </div>

              {/* Service row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Chip
                  icon={Wrench}
                  label="Τεχνικός"
                  value={device.technician?.name ?? "—"}
                />
                {device.estimatedDate && (
                  <Chip
                    icon={CalendarDays}
                    label="Εκτ. Παράδοση"
                    value={formatDate(device.estimatedDate)}
                    valueClass="text-yellow-400"
                  />
                )}
                {device.repairCost != null && (
                  <Chip
                    icon={DollarSign}
                    label="Κόστος"
                    value={formatCurrency(Number(device.repairCost))}
                    valueClass="text-emerald-400"
                  />
                )}
              </div>

            </div>
          </div>

          {/* Photos */}
          <div className="rounded-2xl border border-[#2E3347] bg-[#13151f] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2E3347]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10">
                  <ImagePlus className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">Φωτογραφίες</span>
                <span className="text-xs text-muted-foreground">({device.photos.length}/5)</span>
              </div>
              {device.photos.length < 5 && (
                <button
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/8 transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <ImagePlus className="h-3 w-3" />}
                  Προσθήκη
                </button>
              )}
            </div>

            <div className="p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && handlePhotoUpload(e.target.files)}
              />
              {device.photos.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#2E3347] hover:border-primary/40 rounded-xl py-10 text-center transition-colors group"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/50 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-muted-foreground">Κλικ για προσθήκη φωτογραφιών</p>
                </button>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {device.photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-[#2E3347] hover:border-primary/40 transition-all"
                    >
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                  {device.photos.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#2E3347] hover:border-primary/40 flex items-center justify-center transition-colors group"
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — timeline + chat */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#2E3347] bg-[#13151f] overflow-hidden sticky top-4">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#2E3347]">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Ιστορικό</span>
              {device.history.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  {device.history.length}
                </span>
              )}
            </div>

            <div className="p-5">
              {device.history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Δεν υπάρχει ιστορικό</p>
              ) : (
                <ol className="space-y-0">
                  {device.history.map((entry, i) => (
                    <li key={entry.id} className="flex gap-3">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#13151f] transition-colors",
                          i === 0 ? "bg-primary" : "bg-[#2E3347]"
                        )} />
                        {i < device.history.length - 1 && (
                          <div className="w-px flex-1 bg-[#2E3347] my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={cn("pb-4 flex-1 min-w-0", i === device.history.length - 1 && "pb-0")}>
                        {entry.oldStatus && entry.newStatus && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[entry.oldStatus as DeviceStatus] ?? "")}>
                              {STATUS_LABELS[entry.oldStatus as DeviceStatus] ?? entry.oldStatus}
                            </Badge>
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[entry.newStatus as DeviceStatus] ?? "")}>
                              {STATUS_LABELS[entry.newStatus as DeviceStatus] ?? entry.newStatus}
                            </Badge>
                          </div>
                        )}
                        {!entry.oldStatus && entry.newStatus && (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_COLORS[entry.newStatus as DeviceStatus] ?? "")}>
                            {STATUS_LABELS[entry.newStatus as DeviceStatus] ?? entry.newStatus}
                          </Badge>
                        )}
                        {entry.note && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{entry.note}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground/50">
                          <span>{entry.user?.name ?? "—"}</span>
                          <span>·</span>
                          <span>{formatDateTime(entry.changedAt)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Chat */}
          <DeviceChat deviceId={device.id} />
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => handlePhotoDelete(lightbox)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/80 hover:bg-destructive text-white transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <EditDeviceModal
        open={editOpen}
        device={device}
        onClose={() => setEditOpen(false)}
        onSuccess={updated => setDevice(prev => prev ? { ...prev, ...updated } : prev)}
      />
    </div>
  );
}

/* ── Small reusable chip ── */
function Chip({
  icon: Icon, label, value, valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-[#0F1117] border border-[#2E3347]/60 px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-sm font-medium text-foreground truncate", valueClass)}>{value}</p>
    </div>
  );
}
