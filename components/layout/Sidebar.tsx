"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  BarChart2,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Πίνακας Ελέγχου",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "technician"],
  },
  {
    href: "/devices",
    label: "Συσκευές",
    icon: Smartphone,
    roles: ["admin", "manager", "technician"],
  },
  {
    href: "/users",
    label: "Χρήστες",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/reports",
    label: "Αναφορές",
    icon: BarChart2,
    roles: ["admin", "manager"],
  },
  {
    href: "/settings",
    label: "Ρυθμίσεις",
    icon: Settings,
    roles: ["admin"],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavContent({
  role,
  loading,
  pathname,
  onClose,
}: {
  role: string;
  loading: boolean;
  pathname: string;
  onClose: () => void;
}) {
  const filtered = loading
    ? navItems.filter((item) => item.roles.includes("technician"))
    : navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">
            RepairTrack
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {filtered.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version */}
      <div className="px-6 py-4 border-t border-border shrink-0">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "";
  const loading = status === "loading";

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:h-full lg:bg-card lg:border-r lg:border-border">
        <NavContent role={role} loading={loading} pathname={pathname} onClose={() => {}} />
      </aside>

      {/* ── MOBILE OVERLAY ──────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={onClose}
          />
          <aside className="fixed top-0 left-0 z-30 flex flex-col h-full w-64 bg-card border-r border-border lg:hidden">
            <NavContent role={role} loading={loading} pathname={pathname} onClose={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
