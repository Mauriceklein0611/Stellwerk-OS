"use client";

import Link from "next/link";
import { ArrowRight, ListTree } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { epicsForProject, storiesForProject } from "@/lib/backlog";
import { useBacklogStore } from "@/store/useBacklogStore";

/**
 * Backlog tab of the project detail (TASK-061). Replaces the embedded backlog
 * render with a lightweight reference: a rollup (epics/stories/Σ PT from the
 * backlog store) plus a deep-link into the real `/backlog` workspace. Keeps the
 * backlog as a single source – no second backlog-render logic on the project.
 */
export function BacklogReferenceCard({ projectId }: { projectId: string }) {
  const allEpics = useBacklogStore((state) => state.epics);
  const allStories = useBacklogStore((state) => state.stories);

  const epicCount = epicsForProject(allEpics, projectId).length;
  const stories = storiesForProject(allStories, projectId);
  const storyCount = stories.length;
  const totalPt = stories.reduce((sum, story) => sum + story.estimate_pt, 0);

  const stats = [
    { value: epicCount, label: "Epics" },
    { value: storyCount, label: "Stories" },
    { value: totalPt, label: "Σ PT" },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
            <ListTree className="size-4" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-foreground">
              Backlog dieses Projekts
            </h3>
            <p className="max-w-md text-sm text-muted">
              Epics und Stories werden im Backlog-Bereich gepflegt – eine Quelle
              für Planung, Priorisierung und Zerlegung in Aufgaben.
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="font-mono text-2xl tabular-nums text-foreground">
                {stat.value}
              </span>
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
          ))}
        </div>

        <Link
          href={`/backlog?project=${projectId}`}
          data-testid="project-backlog-open"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Backlog öffnen
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
