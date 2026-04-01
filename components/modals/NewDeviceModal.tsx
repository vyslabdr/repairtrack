"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X, Loader2, CheckCircle, Printer,
  User, Smartphone, Wrench, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DEVICE_BRANDS } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const schema = z.object({
  customerName: z.string().min(1, "Υποχρεωτικό πεδίο"),
  customerPhone: z.string().min(1, "Υποχρεωτικό πεδίο"),
  customerEmail: z.string().email("Μη έγκυρο email").or(z.literal("")).optional(),
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
  1: ["customerName", "customerPhone", "customerEmail"],
  2: ["brand", "model", "serialNumber", "warranty"],
  3: ["issueDesc", "estimatedDate", "repairCost", "technicianId", "notes"],
};

const STEPS = [
  { label: "Πελάτης", icon: User },
  { label: "Συσκευή", icon: Smartphone },
  { label: "Βλάβη", icon: Wrench },
];

interface Technician {
  id: string;
  name: string;
  role: string;
}

interface NewDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewDeviceModal({ open, onClose, onSuccess }: NewDeviceModalProps) {


  const [step, setStep] = useState(1);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [success, setSuccess] = useState<{ ticketId: string } | null>(null);
  const [brandInput, setBrandInput] = useState("");
  const [showBrandList, setShowBrandList] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      fetch("/api/users?role=technician")
        .then((r) => r.json())
        .then(setTechnicians)
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        repairCost: data.repairCost ? parseFloat(data.repairCost) : undefined,
        warranty: data.warranty ?? false,
      }),
    });

    if (!res.ok) {
      toast.error("Σφάλμα κατά την καταχώρηση");
      return;
    }

    const device = await res.json();
    setSuccess({ ticketId: device.ticketId });
    onSuccess();
  }

  function handleClose() {
    reset();
    setBrandInput("");
    setSuccess(null);
    setStep(1);
    onClose();
  }

  const filteredBrands = DEVICE_BRANDS.filter((b) =>
    b.toLowerCase().includes(brandInput.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#13151f] border border-[#2E3347] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">Νέα Συσκευή</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-6 px-8 pb-10 pt-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Η συσκευή καταχωρήθηκε!</p>
              <p className="mt-2 text-sm text-muted-foreground">Κωδικός εισιτηρίου:</p>
              <Badge className="mt-2 text-2xl font-mono px-6 py-2 bg-primary/10 text-primary border-primary/30 h-auto">
                {success.ticketId}
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.print()} className="border-border">
                <Printer className="mr-2 h-4 w-4" />
                Εκτύπωση
              </Button>
              <Button
                onClick={() => { reset(); setBrandInput(""); setSuccess(null); setStep(1); }}
                className="bg-primary hover:bg-primary/90"
              >
                Νέα Καταχώρηση
              </Button>
              <Button variant="outline" onClick={handleClose} className="border-border">
                Κλείσιμο
              </Button>
            </div>
          </div>
        ) : (
          <>
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
            <div className="h-px bg-[#2E3347] mx-0" />

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1 — Customer */}
              <div className={cn("px-6 py-5 space-y-4", step !== 1 && "hidden")}>
                <p className="text-xs text-muted-foreground mb-1">Συμπληρώστε τα στοιχεία του πελάτη</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">
                      Ονοματεπώνυμο <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Γιάννης Παπαδόπουλος"
                      className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                      {...register("customerName")}
                    />
                    {errors.customerName && (
                      <p className="text-[11px] text-destructive">{errors.customerName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">
                      Τηλέφωνο <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="693 000 0000"
                      className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                      {...register("customerPhone")}
                    />
                    {errors.customerPhone && (
                      <p className="text-[11px] text-destructive">{errors.customerPhone.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      placeholder="pelatis@email.com"
                      className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                      {...register("customerEmail")}
                    />
                    {errors.customerEmail && (
                      <p className="text-[11px] text-destructive">{errors.customerEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 — Device */}
              <div className={cn("px-6 py-5 space-y-4", step !== 2 && "hidden")}>
                <p className="text-xs text-muted-foreground mb-1">Εισάγετε τα στοιχεία της συσκευής</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative col-span-2 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">
                      Μάρκα <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Apple, Samsung..."
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
                        {filteredBrands.map((b) => (
                          <li
                            key={b}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 text-foreground"
                            onMouseDown={() => {
                              setBrandInput(b);
                              setValue("brand", b);
                            }}
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.brand && (
                      <p className="text-[11px] text-destructive">{errors.brand.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">
                      Μοντέλο <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="iPhone 15 Pro"
                      className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                      {...register("model")}
                    />
                    {errors.model && (
                      <p className="text-[11px] text-destructive">{errors.model.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">Σειριακός Αριθμός</Label>
                    <Input
                      placeholder="SN123456"
                      className="bg-[#0F1117] border-[#2E3347] focus:border-primary/50 h-10"
                      {...register("serialNumber")}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1 pt-5">
                    <input
                      id="warranty"
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#2E3347] bg-[#0F1117] accent-primary cursor-pointer"
                      {...register("warranty")}
                    />
                    <Label htmlFor="warranty" className="cursor-pointer text-sm text-muted-foreground">
                      Εντός εγγύησης
                    </Label>
                  </div>
                </div>
              </div>

              {/* Step 3 — Issue */}
              <div className={cn("px-6 py-5 space-y-4", step !== 3 && "hidden")}>
                <p className="text-xs text-muted-foreground mb-1">Περιγράψτε τη βλάβη και τις λεπτομέρειες σέρβις</p>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Περιγραφή Βλάβης <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Αναλυτική περιγραφή της βλάβης..."
                    className="w-full rounded-lg border border-[#2E3347] bg-[#0F1117] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none transition-colors"
                    {...register("issueDesc")}
                  />
                  {errors.issueDesc && (
                    <p className="text-[11px] text-destructive">{errors.issueDesc.message}</p>
                  )}
                </div>

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
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Σημειώσεις</Label>
                  <textarea
                    rows={2}
                    placeholder="Πρόσθετες σημειώσεις..."
                    className="w-full rounded-lg border border-[#2E3347] bg-[#0F1117] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none transition-colors"
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="h-px bg-[#2E3347]" />
              <div className="flex items-center justify-between px-6 py-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((s) => s - 1)}
                    className="text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Πίσω
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Ακύρωση
                  </Button>
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

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="bg-primary hover:bg-primary/90 gap-1.5"
                  >
                    Συνέχεια
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 min-w-28"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Αποθήκευση...
                      </>
                    ) : (
                      "Αποθήκευση"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
