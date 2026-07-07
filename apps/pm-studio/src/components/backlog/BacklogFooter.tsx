import type { BacklogSummary } from "@/lib/backlog";

type BacklogFooterProps = {
  summary: BacklogSummary;
};

/**
 * Octane-style aggregate footer for the backlog (TASK-057): number of stories
 * plus Σ planned / Σ done points. Presentational only – the numbers come from
 * `backlogSummary`, whose done-logic reuses `isStoryDone` (TASK-038), so there is
 * no second done-computation here.
 */
export function BacklogFooter({ summary }: BacklogFooterProps) {
  return (
    <div
      data-testid="backlog-footer"
      className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
    >
      <span className="text-muted">
        <span className="font-medium text-foreground">{summary.storyCount}</span>{" "}
        {summary.storyCount === 1 ? "Story" : "Stories"}
      </span>
      <span className="text-muted">
        Σ geplant{" "}
        <span className="font-mono font-medium text-foreground">
          {summary.plannedPt} PT
        </span>
      </span>
      <span className="text-muted">
        Σ erledigt{" "}
        <span className="font-mono font-medium text-foreground">
          {summary.donePt} PT
        </span>
      </span>
    </div>
  );
}
