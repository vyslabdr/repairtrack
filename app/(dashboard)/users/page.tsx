"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Loader2, UserX, Edit, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Role } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

const roleBadgeClass: Record<Role, string> = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  technician: "bg-green-500/10 text-green-400 border-green-500/20",
};

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
  let p = "";
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<{
    name: string; email: string; password: string; role: Role;
  }>({ defaultValues: { role: "technician" } });

  const { register: editReg, handleSubmit: editSubmit, reset: editReset, formState: { isSubmitting: editLoading } } = useForm<{
    name: string; role: Role;
  }>();

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    setUsers(await res.json());
    setLoading(false);
  }

  async function onAddUser(data: { name: string; email: string; password: string; role: Role }) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error === "Email already exists" ? "Το email υπάρχει ήδη" : "Σφάλμα δημιουργίας");
      return;
    }
    const user = await res.json();
    setUsers(prev => [user, ...prev]);
    toast.success(`Ο χρήστης ${user.name} δημιουργήθηκε`);
    reset({ role: "technician" });
    setModalOpen(false);
  }

  async function onEditUser(data: { name: string; role: Role }) {
    if (!editUser) return;
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Σφάλμα ενημέρωσης"); return; }
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    toast.success("Οι αλλαγές αποθηκεύτηκαν");
    setEditUser(null);
  }

  async function onDeactivate(user: User) {
    if (!confirm(`Απενεργοποίηση χρήστη "${user.name}";`)) return;
    const res = await fetch(`/api/users/${user.id}/deactivate`, { method: "PATCH" });
    if (!res.ok) { toast.error("Σφάλμα απενεργοποίησης"); return; }
    const updated = await res.json();
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    toast.success(`Ο χρήστης ${user.name} απενεργοποιήθηκε`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Χρήστες</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.filter(u => u.isActive).length} ενεργοί χρήστες</p>
        </div>
        <Button onClick={() => { reset({ role: "technician" }); setModalOpen(true); }} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> Νέος Χρήστης
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Χρήστης</th>
                <th className="px-4 py-3 text-left font-medium">Ρόλος</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Ημ. Εγγραφής</th>
                <th className="px-4 py-3 text-left font-medium">Κατάσταση</th>
                <th className="px-4 py-3 text-right font-medium">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className={cn("border-b border-border last:border-0 hover:bg-accent/50 transition-colors", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs", roleBadgeClass[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={user.isActive
                      ? "bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                      : "bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs"
                    }>
                      {user.isActive ? "Ενεργός" : "Ανενεργός"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditUser(user); editReset({ name: user.name, role: user.role }); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeactivate(user)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Νέος Χρήστης</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onAddUser)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Ονοματεπώνυμο <span className="text-destructive">*</span></Label>
                <Input className="bg-background border-border" required {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" className="bg-background border-border" required {...register("email")} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Κωδικός <span className="text-destructive">*</span></Label>
                  <button
                    type="button"
                    onClick={() => setValue("password", generatePassword())}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Αυτόματη Δημιουργία
                  </button>
                </div>
                <Input className="bg-background border-border font-mono" required {...register("password")} />
              </div>
              <div className="space-y-1.5">
                <Label>Ρόλος</Label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" {...register("role")}>
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-border">Ακύρωση</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 min-w-28">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Δημιουργία"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Επεξεργασία Χρήστη</h2>
              <button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={editSubmit(onEditUser)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Ονοματεπώνυμο</Label>
                <Input className="bg-background border-border" {...editReg("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Ρόλος</Label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" {...editReg("role")}>
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)} className="border-border">Ακύρωση</Button>
                <Button type="submit" disabled={editLoading} className="bg-primary hover:bg-primary/90 min-w-28">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Αποθήκευση"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
