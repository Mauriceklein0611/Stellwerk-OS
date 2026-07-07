import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/charts/Sparkline";
import type { Metric } from "@/types";

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

/**
 * Metric tile: uppercase label, large mono value (tabular-nums) and a trend
 * pill. Trend stays neutral (muted) on purpose – status colors belong to
 * <StatusBadge> only (design-system.md).
 */
export function MetricCard({ metric }: { metric: Metric }) {
  const TrendIcon = TREND_ICON[metric.trend.direction];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {metric.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted">
            <TrendIcon className="size-3" />
            {metric.trend.value}
          </span>
        </div>
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {metric.value}
        </span>
        <Sparkline data={metric.series} />
      </CardContent>
    </Card>
  );
}
