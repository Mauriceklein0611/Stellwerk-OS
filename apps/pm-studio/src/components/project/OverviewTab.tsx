"use client";

import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { severityBadge } from "@/lib/severity";
import { formatRelativeTime } from "@/lib/format";
import { epicsForProject, storiesForProject } from "@/lib/backlog";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useRiskStore } from "@/store/useRiskStore";
import type { StepTab } from "@/lib/pipeline-steps";
import type { AgentRun, ProjectArtifacts, RiskEntry } from "@/types";

const PRIORITY_RANK: Record<RiskEntry["priority"], number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
};

function OverviewCard({
  title,
  onOpen,
  children,
}: {
  title: string;
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3 text-sm">
        <div className="text-foreground">{children}</div>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex w-fit items-center gap-1 text-xs text-primary transition-opacity hover:opacity-80"
          >
            Zum Tab <ArrowRight className="size-3.5" />
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OverviewTab({
  artifacts,
  projectId,
  runs,
  onNavigate,
}: {
  artifacts: ProjectArtifacts | undefined;
  projectId: string;
  runs: AgentRun[];
  onNavigate: (tab: StepTab) => void;
}) {
  const allEpics = useBacklogStore((state) => state.epics);
  const allStories = useBacklogStore((state) => state.stories);
  // Top risks come from the risk store (TASK-061), not the artifact snapshot, so
  // manual edits/additions reflect here. Selecting the (stable) stored array or
  // undefined avoids the zustand getSnapshot loop; the `?? []` stays in render.
  const projectRisks = useRiskStore((state) => state.risks[projectId]) ?? [];

  if (!artifacts) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-foreground">
          Noch keine Artefakte vorhanden.
        </p>
        <p className="max-w-md text-sm text-muted">
          Führe oben die Pipeline aus – sie erzeugt aus dieser Idee einen
          Entwurf, Requirements, ein Backlog (Epics & Stories) und ein
          Risikoregister. Die Schritte siehst du im Stepper über den Tabs.
        </p>
      </div>
    );
  }

  const topRisks = [...projectRisks]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 3);

  // Backlog counts come from the store (TASK-056), not the artifact snapshot.
  const epicCount = epicsForProject(allEpics, projectId).length;
  const projectStories = storiesForProject(allStories, projectId);
  const storyCount = projectStories.length;
  const totalPt = projectStories.reduce(
    (sum, story) => sum + story.estimate_pt,
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <OverviewCard title="MVP" onOpen={() => onNavigate("draft")}>
        <p className="mb-2 text-muted">{artifacts.draft.mvp.description}</p>
        <ul className="list-disc pl-5 text-muted">
          {artifacts.draft.mvp.features.slice(0, 4).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </OverviewCard>

      <OverviewCard title="Top-Risiken" onOpen={() => onNavigate("risks")}>
        <ul className="flex flex-col gap-2">
          {topRisks.map((risk) => {
            const badge = severityBadge(risk.priority);
            return (
              <li key={risk.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{risk.title}</span>
                <StatusBadge status={badge.status} label={badge.label} />
              </li>
            );
          })}
        </ul>
      </OverviewCard>

      <OverviewCard title="Backlog" onOpen={() => onNavigate("backlog")}>
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="font-mono text-2xl tabular-nums text-foreground">
              {epicCount}
            </span>
            <span className="text-xs text-muted">Epics</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-2xl tabular-nums text-foreground">
              {storyCount}
            </span>
            <span className="text-xs text-muted">Stories</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-2xl tabular-nums text-foreground">
              {totalPt}
            </span>
            <span className="text-xs text-muted">Σ PT</span>
          </div>
        </div>
      </OverviewCard>

      <OverviewCard title="Letzte Agentenläufe">
        {runs.length === 0 ? (
          <p className="text-muted">Keine Läufe in dieser Sitzung.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {runs.slice(0, 5).map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{run.agent}</span>
                <span className="font-mono text-xs text-muted">
                  {formatRelativeTime(run.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </OverviewCard>
    </div>
  );
}
