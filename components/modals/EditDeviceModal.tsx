"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X, Loader2, Smartphone, Wrench,
  ChevronRight, ChevronLeft, CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEVICE_BRANDS } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const schema = z.object({
  brand: z.string().min(1, "Υποχρεωτικό πεδίο"),
  model: z.string().min(1, "Υποχρεωτικό πεδίο"),
  serialNumber: z.string().optional(),
  warranty: z.boolean().optional(),
  issueDesc: z.string().min(1, "Υποχρεωτικό πεδίο"),
  estimatedDate: z.string().optional(),
  repairCost: z.string().optional(),
  technicianId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ["brand", "model", "serialNumber", "warranty", "issueDesc"],
  2: ["estimatedDate", "repairCost", "technicianId", "notes"],
};

const STEPS = [
  { label: "Συσκευή", icon: Smartphone },
  { label: "Σέρβις", icon: Wrench },
];

interface DeviceData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  brand: string;
  model: string;
  serialNumber?: string | null;
  warranty: boolean;
  issueDesc: string;
  estimatedDate?: string | null;
  repairCost?: number | null;
  technicianId?: string | null;
  notes?: string | null;
}

interface Technician { id: string; name: string }

interface EditDeviceModalProps {
  open: boolean;
  device: DeviceData;
  onClose: () => void;
  onSuccess: (updated: DeviceData) => void;
}

export function EditDeviceModal({ open, device, onClose, onSuccess }: EditDeviceModalProps) {
  const [step, setStep] = useState(1);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [brandInput, setBrandInput] = useState(device.brand);
  const [showBrandList, setShowBrandList] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaults(device),
  });

  function getDefaults(d: DeviceData): FormData {
    return {
      brand: d.brand,
      model: d.model,
      serialNumber: d.serialNumber ?? "",
      warranty: d.warranty,
      issueDesc: d.issueDesc,
      estimatedDate: d.estimatedDate ? d.estimatedDate.split("T")[0] : "",
      repairCost: d.repairCost != null ? String(d.repairCost) : "",
      technicianId: d.technicianId ?? "",
      notes: d.notes ?? "",
    };
  }

  useEffect(() => {
    if (open) {
      reset(getDefaults(device));
      setBrandInput(device.brand);
      setStep(1);
      fetch("/api/users?role=technician")
        .then(r => r.json())
        .then(setTechnicians)
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep(s => s + 1);
  }

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/devices/${device.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: brandInput || data.brand,
        model: data.model,
        serialNumber: data.serialNumber || null,
        warranty: data.warranty ?? false,
        issueDesc: data.issueDesc,
        estimatedDate: data.estimatedDate || null,
        repairCost: data.repairCost ? parseFloat(data.repairCost) : null,
        technicianId: data.technicianId || null,
        notes: data.notes || null,
      }),
    });

    if (!res.ok) {
      toast.error("Σφάλμα κατά την αποθήκευση");
      return;
    }

    const updated = await res.json();
    toast.success("Οι αλλαγές αποθηκεύτηκαν");
    onSuccess(updated);
    onClose();
  }

  const filteredBrands = DEVICE_BRANDS.filter(b =>
    b.toLowerCase().includes(brandInput.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#13151f] border border-[#2E3347] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">Επεξεργασία Συσκευής</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pb-5">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;
              const Icon = s.icon;
              return (
                <div key={num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isDone
                          ? "bg-primary border-primary"
                          : isActive
                          ? "bg-primary/10 border-primary"
                          : "bg-white/5 border-white/10"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground/50"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground/40"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 mb-5">
                      <div className="h-[2px] rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: isDone ? "100%" : "0%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2E3347]" />

        <form id="edit-device-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1 — Device */}
          <div className={cn("px-6 py-5 space-y-4", step !== 1 && "hidden")}>
            <p className="text-xs text-muted-foreground mb-1">Επεξεργαστείτε τα στοιχεία της συσκευής</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Brand */}
              <div className="space-y-1.5 relative col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">
                  Μάρκα <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                  value={brandInput}
                  onFocus={() => setShowBrandList(true)}
                  onBlur={() => setTimeout(() => setShowBrandList(false), 150)}
                  onChange={(e) => {
                    setBrandInput(e.target.value);
                    setValue("brand", e.target.value, { shouldValidate: true });
                  }}
                />
                <input type="hidden" {...register("brand")} />
                {showBrandList && filteredBrands.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 top-full mt-1 max-h-36 overflow-y-auto rounded-lg border border-[#2E3347] bg-[#13151f] shadow-xl">
                    {filteredBrands.map(b => (
                      <li
                        key={b}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 text-foreground"
                        onMouseDown={() => { setBrandInput(b); setValue("brand", b); }}
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {errors.brand && <p className="text-[11px] text-destructive">{errors.brand.message}</p>}
              </div>

              {/* Model */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">
                  Μοντέλο <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                  {...register("model")}
                />
                {errors.model && <p className="text-[11px] text-destructive">{errors.model.message}</p>}
              </div>

              {/* Serial */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Σειριακός Αριθμός</Label>
                <Input
                  className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                  {...register("serialNumber")}
                />
              </div>

              {/* Warranty */}
              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1 pt-5">
                <input
                  id="edit-warranty"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#2E3347] bg-[#0F1117] accent-primary cursor-pointer"
                  {...register("warranty")}
                />
                <Label htmlFor="edit-warranty" className="cursor-pointer text-sm text-muted-foreground">
                  Εντός εγγύησης
                </Label>
              </div>

              {/* Issue desc */}
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Περιγραφή Βλάβης <span className="text-destructive">*</span>
                </Label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-[#2E3347] bg-[#0F1117] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none transition-colors"
                  {...register("issueDesc")}
                />
                {errors.issueDesc && <p className="text-[11px] text-destructive">{errors.issueDesc.message}</p>}
              </div>
            </div>
          </div>

          {/* Step 2 — Service */}
          <div className={cn("px-6 py-5 space-y-4", step !== 2 && "hidden")}>
            <p className="text-xs text-muted-foreground mb-1">Ενημερώστε τα στοιχεία σέρβις</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Εκτιμώμενη Ημερομηνία</Label>
                <Input
                  type="date"
                  className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                  {...register("estimatedDate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Κόστος Επισκευής (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                  {...register("repairCost")}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Τεχνικός</Label>
                <select
                  className="w-full rounded-lg border border-[#2E3347] bg-[#0F1117] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  {...register("technicianId")}
                >
                  <option value="">— Χωρίς ανάθεση —</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Σημειώσεις</Label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-[#2E3347] bg-[#0F1117] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none transition-colors"
                  {...register("notes")}
                />
              </div>
            </div>
          </div>

        </form>

        {/* Footer — intentionally outside <form> to prevent accidental submission */}
        <div className="h-px bg-[#2E3347]" />
        <div className="flex items-center justify-between px-6 py-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Πίσω
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ακύρωση
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  step === i + 1
                    ? "w-4 h-1.5 bg-primary"
                    : step > i + 1
                    ? "w-1.5 h-1.5 bg-primary/60"
                    : "w-1.5 h-1.5 bg-white/10"
                )}
              />
            ))}
          </div>

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              Συνέχεια
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-28 justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Αποθήκευση...
                </>
              ) : (
                "Αποθήκευση"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
