"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "@/components/dashboard/charts/ChartEmpty";
import { STATUS_COLOR_VARS } from "@/components/agents/StatusBadge";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { TaskStatusSlice } from "@/types";

/** Donut of tasks by status. Slice colors come from the status tokens. */
export function TaskStatusDonut({ data }: { data: TaskStatusSlice[] }) {
  const reduced = useReducedMotion();

  const config = Object.fromEntries(
    data.map((slice) => [
      slice.label,
      { label: slice.label, color: STATUS_COLOR_VARS[slice.status] },
    ]),
  ) satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Aufgaben nach Status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ChartContainer config={config} className="aspect-auto h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                  isAnimationActive={!reduced}
                >
                  {data.map((slice) => (
                    <Cell
                      key={slice.status}
                      fill={STATUS_COLOR_VARS[slice.status]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1.5">
              {data.map((slice) => (
                <li
                  key={slice.status}
                  className="flex items-center gap-1.5 text-xs text-muted"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR_VARS[slice.status] }}
                  />
                  {slice.label}
                  <span className="font-mono tabular-nums text-foreground">
                    {slice.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
