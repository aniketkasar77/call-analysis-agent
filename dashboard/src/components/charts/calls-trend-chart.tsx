"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND } from "@/lib/brand";
import { buildChartSeries, ChartPoint } from "@/lib/chart-data";
import { LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Range = "daily" | "weekly" | "monthly";

interface CallsTrendChartProps {
  items: Array<{ created_at?: string }>;
}

const ranges: { key: Range; label: string }[] = [
  { key: "daily", label: LABELS.daily },
  { key: "weekly", label: LABELS.weekly },
  { key: "monthly", label: LABELS.monthly },
];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{point.label}</p>
      <p className="text-muted-foreground">{point.value} call{point.value === 1 ? "" : "s"} reviewed</p>
    </div>
  );
}

export function CallsTrendChart({ items }: CallsTrendChartProps) {
  const [range, setRange] = useState<Range>("daily");
  const data = useMemo(
    () => buildChartSeries(items, range, (i) => i.created_at),
    [items, range]
  );
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{LABELS.callsTrend}</h3>
          <p className="text-xs text-muted-foreground">{total} in this period</p>
        </div>
        <div className="flex gap-1 self-start rounded-xl bg-muted p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                range === r.key ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, "auto"]} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={BRAND.primary}
            fill="url(#callsGrad)"
            strokeWidth={2}
            dot={{ r: 3, fill: BRAND.primary, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
