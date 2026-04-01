"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AppSettingsProvider } from "@/lib/app-settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppSettingsProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </AppSettingsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
