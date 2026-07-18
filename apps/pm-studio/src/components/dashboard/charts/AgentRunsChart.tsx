"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "@/components/dashboard/charts/ChartEmpty";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { AgentDurationBar } from "@/types";

const config = {
  seconds: { label: "Dauer (s)", color: "var(--accent)" },
} satisfies ChartConfig;

/** Horizontal bars: total run duration per agent. */
export function AgentRunsChart({ data }: { data: AgentDurationBar[] }) {
  const reduced = useReducedMotion();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agentenläufe (Dauer)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                dataKey="seconds"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                unit="s"
              />
              <YAxis
                type="category"
                dataKey="agent"
                tickLine={false}
                axisLine={false}
                width={118}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="seconds"
                fill="var(--color-seconds)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
