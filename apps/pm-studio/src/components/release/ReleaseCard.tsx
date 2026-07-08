"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/agents/StatusBadge";
import {
  RELEASE_STATUS,
  SPRINT_LENGTH_LABEL,
  formatReleaseRange,
} from "@/lib/release-meta";
import { formatSprintRange, isActiveSprint } from "@/lib/sprint";
import type { ReleaseProgress, ReleaseScope } from "@/lib/release";
import type { PlannedSprint, Release } from "@/types";

type ReleaseCardProps = {
  release: Release;
  /** Aggregated progress over the release's sprints (TASK-041). */
  progress: ReleaseProgress;
  /** Content scope: stories assigned to the release via releaseId (TASK-062). */
  scope: ReleaseScope;
  /** The release's sprints, sorted, for the timeline (TASK-041). */
  sprints: PlannedSprint[];
  /** Today as ISO date (`YYYY-MM-DD`), client-derived for SSR safety. */
  today?: string;
  onEdit: () => void;
  /** Re-generate this release's sprints (idempotent). */
  onRegenerate: () => void;
};

/**
 * Card for a single release: status, scope, computed progress and a sprint
 * timeline. The progress is derived purely from the release's sprints/stories
 * (`releaseProgress`, which builds on the TASK-038 done-semantics) – this card
 * only renders the pre-computed numbers.
 */
export function ReleaseCard({
  release,
  progress,
  scope,
  sprints,
  today,
  onEdit,
  onRegenerate,
}: ReleaseCardProps) {
  const { donePt, plannedPt, doneCount, total, sprintCount } = progress;
  const meta = RELEASE_STATUS[release.status];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate font-medium text-foreground">{release.name}</p>
            <p className="text-xs text-muted">
              {formatReleaseRange(release.startDate, release.endDate)}
            </p>
          </div>
          <Button variant="ghost" size="xs" onClick={onEdit}>
            Bearbeiten
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={meta.status} label={meta.label} />
          <Badge variant="outline" className="w-fit">
            {SPRINT_LENGTH_LABEL[release.sprintLengthWeeks]}
          </Badge>
          <Badge variant="outline" className="w-fit">
            {sprintCount} {sprintCount === 1 ? "Sprint" : "Sprints"}
          </Badge>
        </div>

        {/* Content scope (TASK-062): stories explicitly assigned via releaseId,
            independent of sprint membership. Done via isStoryDone (TASK-038). */}
        <div
          data-testid={`release-scope-${release.id}`}
          className="flex items-center justify-between gap-2 text-xs text-muted"
        >
          <span>
            Scope: {scope.storyCount}{" "}
            {scope.storyCount === 1 ? "Story" : "Stories"}
          </span>
          <span className="font-mono">
            {scope.donePt} / {scope.plannedPt} PT · {scope.doneCount}/
            {scope.storyCount}
          </span>
        </div>

        {/* Sprint-based delivery progress, computed from the release's sprints. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              Sprints: {total} {total === 1 ? "Story" : "Stories"} · {plannedPt} PT
            </span>
            <span data-testid={`release-progress-${release.id}`} className="font-mono">
              erledigt {donePt} / {plannedPt} PT · {doneCount}/{total}
            </span>
          </div>
          <ProgressBar
            value={donePt}
            max={plannedPt}
            status="success"
            label={`Release-Fortschritt ${release.name}: ${donePt} von ${plannedPt} PT erledigt`}
          />
        </div>

        {/* Sprint timeline – simple dated sequence, active sprint highlighted. */}
        <div
          data-testid={`release-timeline-${release.id}`}
          className="flex flex-col gap-1 border-t border-border pt-2"
        >
          <p className="text-xs font-medium text-muted">Timeline</p>
          {sprints.length === 0 ? (
            <p className="text-xs text-muted">
              Noch keine Sprints – unten neu generieren.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {sprints.map((sprint) => {
                const active = today ? isActiveSprint(sprint, today) : false;
                const range = formatSprintRange(sprint);
                return (
                  <li
                    key={sprint.id}
                    data-testid={`release-timeline-sprint-${sprint.id}`}
                    data-active={active}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs data-[active=true]:bg-secondary"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-foreground">{sprint.name}</span>
                      {active && <StatusBadge status="running" label="Aktiv" />}
                    </span>
                    {range && (
                      <span className="shrink-0 font-mono text-muted">{range}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Button
          variant="outline"
          size="xs"
          className="w-fit"
          onClick={onRegenerate}
        >
          Sprints neu generieren
        </Button>
      </CardContent>
    </Card>
  );
}
