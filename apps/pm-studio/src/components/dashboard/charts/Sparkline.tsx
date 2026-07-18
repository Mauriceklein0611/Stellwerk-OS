"use client";

import { useId } from "react";
import { Area, AreaChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { MetricSeriesPoint } from "@/types";

const config = {
  value: { label: "Verlauf", color: "var(--primary)" },
} satisfies ChartConfig;

/** Tiny area chart for a MetricCard – no axes, no tooltip, just the trend. */
export function Sparkline({ data }: { data: MetricSeriesPoint[] }) {
  const reduced = useReducedMotion();
  const gradientId = `spark-${useId().replace(/:/g, "")}`;

  if (data.length === 0) return null;

  return (
    <ChartContainer config={config} className="aspect-auto h-10 w-full">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={!reduced}
        />
      </AreaChart>
    </ChartContainer>
  );
}
