import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { AgentRun } from "@/types";

/**
 * Recent agent runs: agent + project, status badge and relative time.
 * Renders an empty state with a CTA when there are no runs.
 */
export function ActivityFeed({ runs }: { runs: AgentRun[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agenten-Aktivität</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted">Noch keine Agentenläufe.</p>
            <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Pipeline für ein Projekt starten
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {runs.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {run.agent}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {run.project}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={run.status} />
                  <span className="w-16 text-right font-mono text-xs tabular-nums text-muted">
                    {formatRelativeTime(run.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
