"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sun, Moon, Wrench, LayoutDashboard, Smartphone, Users, BarChart2, Settings, Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/lib/app-settings-context";

const navItems = [
  { href: "/dashboard", label: "Πίνακας", icon: LayoutDashboard, roles: ["admin", "manager", "technician"] },
  { href: "/devices", label: "Συσκευές", icon: Smartphone, roles: ["admin", "manager", "technician"] },
  { href: "/users", label: "Χρήστες", icon: Users, roles: ["admin"] },
  { href: "/reports", label: "Αναφορές", icon: BarChart2, roles: ["admin", "manager"] },
  { href: "/settings", label: "Ρυθμίσεις", icon: Settings, roles: ["admin"] },
];

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { shopName, logoUrl } = useAppSettings();
  useEffect(() => setMounted(true), []);

  const user = session?.user as { name?: string; email?: string; role?: Role };
  const role = user?.role ?? "";
  const filtered = role
    ? navItems.filter((item) => item.roles.includes(role))
    : navItems.filter((item) => item.roles.includes("technician"));


  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-card px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-6 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 overflow-hidden">
            {logoUrl ? (
              <Image src={logoUrl} alt={shopName} width={32} height={32} className="object-cover w-full h-full" />
            ) : (
              <Wrench className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="font-bold text-foreground text-base tracking-tight hidden sm:block">{shopName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {filtered.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {/* User menu */}
          <ProfileDropdown
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            role={(user?.role as Role) ?? "technician"}
          />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <nav className="fixed top-16 left-0 right-0 z-20 bg-card border-b border-border p-3 space-y-1 md:hidden">
            {filtered.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
