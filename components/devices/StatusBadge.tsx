"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { toast } from "sonner";

const STATUSES: DeviceStatus[] = [
  "received",
  "inspecting",
  "repairing",
  "awaiting_delivery",
  "archived",
];

interface StatusBadgeProps {
  deviceId: string;
  status: DeviceStatus;
  onUpdated?: (newStatus: DeviceStatus) => void;
  readonly?: boolean;
}

export function StatusBadge({ deviceId, status, onUpdated, readonly }: StatusBadgeProps) {
  const [current, setCurrent] = useState<DeviceStatus>(status);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(status);
  }, [status]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
    setOpen((v) => !v);
  }

  async function handleSelect(newStatus: DeviceStatus) {
    if (newStatus === current) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);

    const res = await fetch(`/api/devices/${deviceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error("Σφάλμα ενημέρωσης κατάστασης");
      return;
    }

    setCurrent(newStatus);
    onUpdated?.(newStatus);
    toast.success(`Κατάσταση: ${STATUS_LABELS[newStatus]}`);
  }

  if (readonly) {
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[current])}>
        {STATUS_LABELS[current]}
      </span>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80",
          STATUS_COLORS[current]
        )}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            {STATUS_LABELS[current]}
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="w-48 rounded-lg border border-border bg-popover shadow-xl py-1"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2",
                s === current && "bg-accent"
              )}
            >
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[s])}>
                {STATUS_LABELS[s]}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
