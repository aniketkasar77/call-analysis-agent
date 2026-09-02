"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { BRAND } from "@/lib/brand";

interface MiniSparklineProps {
  data: number[];
  color?: string;
}

export function MiniSparkline({ data, color = BRAND.primary }: MiniSparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={chartData}>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
