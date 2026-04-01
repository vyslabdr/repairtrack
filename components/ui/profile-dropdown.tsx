"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Settings, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/types";

const roleBadgeClass: Record<Role, string> = {
  admin: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
  manager: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
  technician: "text-green-400 bg-green-500/10 border border-green-500/20",
};

const roleGradient: Record<Role, string> = {
  admin: "linear-gradient(135deg, #a855f7, #ec4899, #fb923c)",
  manager: "linear-gradient(135deg, #3b82f6, #22d3ee, #2dd4bf)",
  technician: "linear-gradient(135deg, #22c55e, #34d399, #2dd4bf)",
};

interface ProfileDropdownProps {
  name: string;
  email: string;
  role: Role;
  className?: string;
}

export function ProfileDropdown({ name, email, role, className }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  if (!name) return null;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const gradient = roleGradient[role] ?? "linear-gradient(135deg, #6366f1, #8b5cf6)";

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          {/* Trigger */}
          <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-muted/60 border border-border hover:bg-accent transition-all duration-200 focus:outline-none outline-none">
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-foreground tracking-tight leading-tight">
                {name}
              </div>
              <div className="text-xs text-muted-foreground tracking-tight leading-tight mt-0.5">
                {email}
              </div>
            </div>
            {/* Avatar with gradient ring via inline style */}
            <div
              className="w-9 h-9 rounded-full p-0.5 shrink-0 flex items-center justify-center"
              style={{ background: gradient }}
            >
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">{initials}</span>
              </div>
            </div>
          </DropdownMenuTrigger>

          {/* Bending line indicator */}
          <div className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none",
            isOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
          )}>
            <svg width="12" height="24" viewBox="0 0 12 24" fill="none"
              className={cn("transition-all duration-200", isOpen ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground")}
              aria-hidden="true"
            >
              <path d="M2 4C6 8 6 16 2 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-2 rounded-2xl shadow-xl border border-border bg-card backdrop-blur-sm"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 p-3 mb-1 rounded-xl bg-muted/40 border border-border/50">
              <div
                className="w-10 h-10 rounded-full p-0.5 shrink-0"
                style={{ background: gradient }}
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{initials}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
                <span className={cn("inline-flex items-center text-[10px] font-medium rounded-md px-1.5 py-0.5 mt-1", roleBadgeClass[role])}>
                  <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                  {ROLE_LABELS[role] ?? role}
                </span>
              </div>
            </div>

            {/* Settings */}
            <DropdownMenuItem
              className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border border-transparent"
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Προφίλ & Ρυθμίσεις</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Sign out */}
            <DropdownMenuItem
              className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer bg-destructive/10 hover:bg-destructive/20 border border-transparent hover:border-destructive/30 text-destructive focus:text-destructive focus:bg-destructive/20"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Αποσύνδεση</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
}
