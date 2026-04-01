"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Loader2, Save, RefreshCw, CheckCircle, AlertCircle,
  Eye, EyeOff, ShieldCheck, Wrench, ImagePlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface VersionInfo {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
  changelog: string | null;
  checkedAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();

  const [shopName, setShopName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetPassForm,
    formState: { isSubmitting },
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  useEffect(() => {
    fetch("/api/system/settings")
      .then(r => r.json())
      .then(d => {
        setShopName(d.shop_name ?? "RepairTrack");
        setLogoUrl(d.shop_logo ?? null);
      })
      .catch(() => {});
  }, []);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);
    form.append("deviceId", "logo");
    const res = await fetch("/api/upload/photo", { method: "POST", body: form });
    if (!res.ok) { toast.error("Logo yükleme hatası"); setUploadingLogo(false); return; }
    const { url } = await res.json();
    setLogoUrl(url);
    await fetch("/api/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop_logo: url }),
    });
    setUploadingLogo(false);
    toast.success("Logo güncellendi");
  }

  async function removeLogo() {
    setLogoUrl(null);
    await fetch("/api/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop_logo: "" }),
    });
    toast.success("Logo kaldırıldı");
  }

  async function saveShopSettings() {
    setSavingShop(true);
    const res = await fetch("/api/system/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop_name: shopName }),
    });
    setSavingShop(false);
    if (res.ok) toast.success("Οι ρυθμίσεις αποθηκεύτηκαν");
    else toast.error("Σφάλμα αποθήκευσης");
  }

  async function checkVersion() {
    setCheckingVersion(true);
    const res = await fetch("/api/system/version");
    setVersion(await res.json());
    setCheckingVersion(false);
  }

  async function onChangePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    if (!data.currentPassword) {
      toast.error("Εισάγετε τον τρέχοντα κωδικό");
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Οι κωδικοί δεν ταιριάζουν");
      return;
    }
    if (data.newPassword.length < 8) {
      toast.error("Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες");
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error === "Λάθος τρέχων κωδικός" ? "Λάθος τρέχων κωδικός" : "Σφάλμα αλλαγής κωδικού");
      return;
    }
    toast.success("Ο κωδικός άλλαξε. Θα αποσυνδεθείτε.");
    resetPassForm();
    setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ρυθμίσεις</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Διαχείριση συστήματος</p>
      </div>

      {/* Shop settings */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Στοιχεία Καταστήματος
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* Logo */}
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl border border-border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <Image src={logoUrl} alt="logo" width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }}
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer">
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadingLogo ? "Yükleniyor..." : "Logo Yükle"}
                  </span>
                </label>
                {logoUrl && (
                  <button onClick={removeLogo} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3 w-3" /> Kaldır
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG veya WebP · Maks 5MB</p>
          </div>

          {/* Shop name */}
          <div className="space-y-1.5">
            <Label>Όνομα Καταστήματος</Label>
            <Input
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              className="bg-background border-border"
              placeholder="RepairTrack"
            />
          </div>
          <Button onClick={saveShopSettings} disabled={savingShop} className="bg-primary hover:bg-primary/90">
            {savingShop ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Αποθήκευση
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Λογαριασμός
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-2">
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground">Όνομα</p>
              <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-xs text-muted-foreground">Ρόλος</p>
              <p className="text-sm font-medium text-foreground capitalize">{(session?.user as { role?: string })?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Αλλαγή Κωδικού
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Τρέχων Κωδικός</Label>
              <div className="relative">
                <Input type={showOld ? "text" : "password"} className="bg-background border-border pr-10" placeholder="••••••••" {...register("currentPassword")} />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Νέος Κωδικός</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} className="bg-background border-border pr-10" placeholder="••••••••" {...register("newPassword")} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Επιβεβαίωση Κωδικού</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} className="bg-background border-border pr-10" placeholder="••••••••" {...register("confirmPassword")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Αλλαγή Κωδικού
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Version panel */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" /> Έκδοση Συστήματος
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Τρέχουσα Έκδοση</p>
              <p className="text-lg font-bold text-foreground font-mono mt-0.5">
                v{version?.current ?? "1.0.0"}
              </p>
            </div>
            {version && (
              <div>
                {version.hasUpdate ? (
                  <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 border">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Νέα Έκδοση: v{version.latest}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 border">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ενημερωμένο
                  </Badge>
                )}
              </div>
            )}
          </div>

          {version?.checkedAt && (
            <p className="text-xs text-muted-foreground">
              Τελευταίος έλεγχος: {new Date(version.checkedAt).toLocaleString("el-GR")}
            </p>
          )}

          {version?.hasUpdate && version.changelog && (
            <>
              <Separator className="bg-border" />
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Νέα στην έκδοση v{version.latest}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {version.changelog.slice(0, 500)}{version.changelog.length > 500 ? "..." : ""}
                </p>
              </div>
            </>
          )}

          <Button variant="outline" onClick={checkVersion} disabled={checkingVersion} className="border-border">
            {checkingVersion ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            Έλεγχος για Ενημερώσεις
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
