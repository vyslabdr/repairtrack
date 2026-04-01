"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Download, BarChart2, Clock, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_COLORS, DeviceStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS: Record<DeviceStatus, string> = {
  received: "#3B82F6", inspecting: "#F59E0B",
  repairing: "#F97316", awaiting_delivery: "#22C55E", archived: "#6B7280",
};

interface ReportData {
  totalDevices: number;
  statusMap: Record<string, number>;
  technicianLoad: { name: string; count: number }[];
  avgRepairDays: number;
  dailyTrend: { day: string; count: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReport = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/reports/summary?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Κατάσταση", "Αριθμός"],
      ...Object.entries(data.statusMap).map(([k, v]) => [STATUS_LABELS[k as DeviceStatus] ?? k, v]),
      [],
      ["Τεχνικός", "Συσκευές"],
      ...data.technicianLoad.map(t => [t.name, t.count]),
      [],
      ["Σύνολο Συσκευών", data.totalDevices],
      ["Μέσος Χρόνος Επισκευής (ημέρες)", data.avgRepairDays],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repairtrack-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pieData = data
    ? (Object.keys(data.statusMap) as DeviceStatus[])
        .filter(k => data.statusMap[k] > 0)
        .map(k => ({ name: STATUS_LABELS[k], value: data.statusMap[k], color: PIE_COLORS[k] }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Αναφορές</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Στατιστικά & αναλύσεις</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!data} className="border-border">
          <Download className="h-4 w-4 mr-1.5" /> Εξαγωγή CSV
        </Button>
      </div>

      {/* Date filter */}
      <Card className="border-border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Από</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background border-border h-9 text-sm w-36" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Έως</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background border-border h-9 text-sm w-36" />
          </div>
          <Button onClick={fetchReport} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ανανέωση"}
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Σύνολο Συσκευών</p>
                  <p className="text-3xl font-bold text-primary mt-2">{data.totalDevices}</p>
                </div>
                <div className="rounded-xl p-2.5 bg-primary/10 border border-primary/20">
                  <BarChart2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card>
            <Card className="border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Υπό Επισκευή</p>
                  <p className="text-3xl font-bold text-orange-400 mt-2">{data.statusMap["repairing"] ?? 0}</p>
                </div>
                <div className="rounded-xl p-2.5 bg-orange-500/10 border border-orange-500/20">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </Card>
            <Card className="border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Μέσος Χρόνος</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{data.avgRepairDays}<span className="text-base font-normal text-muted-foreground ml-1">ημ.</span></p>
                </div>
                <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </Card>
            <Card className="border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Αρχειοθετημένα</p>
                  <p className="text-3xl font-bold text-gray-400 mt-2">{data.statusMap["archived"] ?? 0}</p>
                </div>
                <div className="rounded-xl p-2.5 bg-gray-500/10 border border-gray-500/20">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Daily trend */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Καθημερινή Τάση</CardTitle>
              </CardHeader>
              <CardContent>
                {data.dailyTrend.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Δεν υπάρχουν δεδομένα</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#1A1D27", border: "1px solid #2E3347", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }} cursor={{ fill: "rgba(99,102,241,0.08)" }} formatter={(v) => [v, "Συσκευές"]} />
                      <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status pie */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Κατανομή Κατάστασης</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Δεν υπάρχουν δεδομένα</div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1A1D27", border: "1px solid #2E3347", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }} formatter={(v) => [v, "Συσκευές"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {pieData.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-semibold text-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown table + Technician load */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Ανάλυση Κατάστασης</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="space-y-2">
                  {(Object.keys(STATUS_LABELS) as DeviceStatus[]).map(s => {
                    const count = data.statusMap[s] ?? 0;
                    const pct = data.totalDevices > 0 ? Math.round((count / data.totalDevices) * 100) : 0;
                    return (
                      <div key={s}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[s])}>
                            {STATUS_LABELS[s]}
                          </span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Φόρτος Τεχνικών</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {data.technicianLoad.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Δεν υπάρχουν δεδομένα</p>
                ) : (
                  <div className="space-y-3">
                    {data.technicianLoad.map((t, i) => {
                      const max = Math.max(...data.technicianLoad.map(x => x.count));
                      const pct = max > 0 ? Math.round((t.count / max) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{t.name}</span>
                            <span className="text-muted-foreground">{t.count} συσκευές</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
