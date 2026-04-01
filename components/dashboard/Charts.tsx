"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, DeviceStatus } from "@/types";

const PIE_COLORS: Record<DeviceStatus, string> = {
  received: "#3B82F6",
  inspecting: "#F59E0B",
  repairing: "#F97316",
  awaiting_delivery: "#22C55E",
  archived: "#6B7280",
};

interface ChartsProps {
  weekly: { day: string; count: number }[];
  counts: Partial<Record<DeviceStatus, number>>;
}

export function Charts({ weekly, counts }: ChartsProps) {
  const pieData = (Object.keys(counts) as DeviceStatus[])
    .filter((k) => (counts[k] ?? 0) > 0)
    .map((k) => ({
      name: STATUS_LABELS[k],
      value: counts[k] ?? 0,
      color: PIE_COLORS[k],
    }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Bar chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Νέες Συσκευές — Τελευταίες 7 Ημέρες
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1D27",
                  border: "1px solid #2E3347",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F1F5F9",
                }}
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                formatter={(v) => [v, "Συσκευές"]}
              />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Κατανομή Κατάστασης
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Δεν υπάρχουν δεδομένα
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1D27",
                    border: "1px solid #2E3347",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#F1F5F9",
                  }}
                  formatter={(v) => [v, "Συσκευές"]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
