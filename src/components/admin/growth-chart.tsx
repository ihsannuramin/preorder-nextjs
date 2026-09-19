"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DailyCount } from "@/lib/utils/admin-metrics";

type GrowthChartProps = {
  data: DailyCount[];
  label: string;
  color?: string;
};

export function GrowthChart({ data, label, color = "#8B5CF6" }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(value: string) => value.slice(5)}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
        <Tooltip formatter={(value: number) => [value, label]} labelFormatter={(l) => l} />
        <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
