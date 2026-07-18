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
import type { VelocityPoint } from "@/types";

const config = {
  points: { label: "Erledigt (PT)", color: "var(--primary)" },
  planned: { label: "Geplant (PT)", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/** Completed vs. planned person-days per sprint. */
export function VelocityChart({ data }: { data: VelocityPoint[] }) {
  const reduced = useReducedMotion();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Velocity</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="sprint" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="planned"
                fill="var(--color-planned)"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.35}
                isAnimationActive={!reduced}
              />
              <Bar
                dataKey="points"
                fill="var(--color-points)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
