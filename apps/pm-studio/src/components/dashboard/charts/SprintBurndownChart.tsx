"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "@/components/dashboard/charts/ChartEmpty";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { BurndownDay } from "@/lib/burndown";

const config = {
  remaining: { label: "Verbleibend", color: "var(--primary)" },
  ideal: { label: "Ideal", color: "var(--muted)" },
} satisfies ChartConfig;

/**
 * Sprint burndown for the active/selected sprint: actual remaining person-days
 * (area, stops at today) vs. the ideal line (dashed). `subtitle` names the
 * sprint, `action` slots an optional sprint selector into the header.
 */
export function SprintBurndownChart({
  data,
  subtitle,
  action,
}: {
  data: BurndownDay[];
  subtitle?: string;
  action?: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>Sprint-Burndown</CardTitle>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="burndownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-remaining)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-remaining)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="remaining"
                type="monotone"
                stroke="var(--color-remaining)"
                strokeWidth={2}
                fill="url(#burndownFill)"
                isAnimationActive={!reduced}
              />
              <Line
                dataKey="ideal"
                type="linear"
                stroke="var(--color-ideal)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={!reduced}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
