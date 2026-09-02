"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InsightSummary } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { buildChartSeries, ChartPoint } from "@/lib/chart-data";
import { LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Range = "daily" | "weekly" | "monthly";

interface IssuesTrendChartProps {
  insights: InsightSummary[];
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
      <p className="text-muted-foreground">
        {point.value} call{point.value === 1 ? "" : "s"} linked to issues
      </p>
    </div>
  );
}

export function IssuesTrendChart({ insights }: IssuesTrendChartProps) {
  const [range, setRange] = useState<Range>("daily");
  const data = useMemo(
    () => buildChartSeries(insights, range, (i) => i.created_at, (i) => i.frequency),
    [insights, range]
  );
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const isEmpty = insights.length === 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{LABELS.issuesTrend}</h3>
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "No recurring issues yet" : `${total} calls linked in this period`}
          </p>
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
        <BarChart data={data}>
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
          <Bar dataKey="value" fill={BRAND.primary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {isEmpty && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {LABELS.noPatternsFound}
        </p>
      )}
    </div>
  );
}
