"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AppSettings {
  shopName: string;
  logoUrl: string | null;
}

const AppSettingsContext = createContext<AppSettings>({
  shopName: "RepairTrack",
  logoUrl: null,
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    shopName: "RepairTrack",
    logoUrl: null,
  });

  useEffect(() => {
    fetch("/api/system/public-settings")
      .then((r) => r.json())
      .then((d) => setSettings({ shopName: d.shopName, logoUrl: d.logoUrl }))
      .catch(() => {});
  }, []);

  return (
    <AppSettingsContext.Provider value={settings}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
