"use client";

import { ListChecks, Play } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { StoryTasks } from "@/components/project/StoryTasks";
import { severityBadge } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { epicsForProject, storiesForEpic } from "@/lib/backlog";
import { useBoardStore } from "@/store/useBoardStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { SprintSuggestion } from "@/types";

type BacklogViewProps = {
  projectId: string;
  projectName: string;
  /** Sprint suggestions still live on the run artifact (TASK-056). */
  sprintSuggestions: SprintSuggestion[];
};

/**
 * Empty state for the Backlog tab when no pipeline has produced artifacts yet
 * (TASK-052). Instead of a bare "nothing here" line, it explains the link
 * Story → Aufgaben and offers a direct CTA to run the pipeline.
 */
export function BacklogEmpty({
  onRunPipeline,
  isRunning,
}: {
  onRunPipeline: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
      <ListChecks className="size-8 text-muted" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Noch kein Backlog</p>
        <p className="mx-auto max-w-md text-sm text-muted">
          Führe die Pipeline aus, um aus der Idee Epics und User Stories zu
          erzeugen. Anschließend kannst du jede Story in konkrete Aufgaben
          zerlegen.
        </p>
      </div>
      <Button onClick={onRunPipeline} disabled={isRunning}>
        <Play /> Pipeline ausführen
      </Button>
    </div>
  );
}

/** Renders the project's backlog store entities: epics as accordions, stories
 * with AKs. Reads from `useBacklogStore` (TASK-056); sprint suggestions are the
 * only piece still passed in from the run artifact. */
export function BacklogView({
  projectId,
  projectName,
  sprintSuggestions,
}: BacklogViewProps) {
  const tasks = useBoardStore((state) => state.tasks);
  const addTask = useBoardStore((state) => state.addTask);
  const allEpics = useBacklogStore((state) => state.epics);
  const allStories = useBacklogStore((state) => state.stories);

  const epics = epicsForProject(allEpics, projectId);

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        multiple
        // Open every epic by default so a story's "Aufgaben" section is visible
        // without first hunting through collapsed epics (TASK-052 discoverability;
        // was epics.slice(0, 1) = only the first epic).
        defaultValue={epics.map((epic) => epic.id)}
        className="rounded-xl border border-border px-4"
      >
        {epics.map((epic) => {
          const epicStories = storiesForEpic(allStories, epic.id);
          return (
          <AccordionItem key={epic.id} value={epic.id}>
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                {epic.title}
                <span className="font-mono text-xs text-muted">
                  {epicStories.length} Stories
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {epicStories.map((story) => {
                  const badge = severityBadge(story.priority);
                  const storyTaskCount = tasks.filter(
                    (task) => task.storyId === story.id,
                  ).length;
                  const inBoard = storyTaskCount > 0;
                  return (
                    <li
                      key={story.id}
                      className="rounded-lg border border-border bg-surface p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {story.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          {/* At-a-glance task count that jumps to the Aufgaben
                              section below (TASK-052 discoverability). */}
                          <button
                            type="button"
                            data-testid={`story-task-count-${story.id}`}
                            onClick={() =>
                              document
                                .getElementById(`story-tasks-${story.id}`)
                                ?.scrollIntoView?.({
                                  behavior: "smooth",
                                  block: "nearest",
                                })
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
                          >
                            <ListChecks className="size-3" aria-hidden />
                            {storyTaskCount === 0
                              ? "Keine Aufgaben"
                              : `${storyTaskCount} ${
                                  storyTaskCount === 1 ? "Aufgabe" : "Aufgaben"
                                }`}
                          </button>
                          <StatusBadge status={badge.status} label={badge.label} />
                          <span className="font-mono text-xs text-muted">
                            {story.estimate_pt} PT
                          </span>
                        </div>
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                        {story.acceptance_criteria.map((criterion) => (
                          <li
                            key={criterion.id}
                            className={cn(criterion.done && "line-through")}
                          >
                            {criterion.text}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={inBoard}
                          onClick={() =>
                            addTask({
                              id: crypto.randomUUID(),
                              title: story.title,
                              column: "backlog",
                              projectId,
                              projectName,
                              storyId: story.id,
                              estimate_pt: story.estimate_pt,
                              priority: story.priority,
                            })
                          }
                        >
                          {inBoard ? "Im Board" : "In Board übernehmen"}
                        </Button>
                      </div>
                      <StoryTasks
                        story={story}
                        projectId={projectId}
                        projectName={projectName}
                      />
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
          );
        })}
      </Accordion>

      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          Sprint-Vorschläge
        </h3>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {sprintSuggestions.map((sprint) => (
            <li key={sprint.name}>
              <span className="font-medium text-foreground">{sprint.name}: </span>
              {sprint.goal}
              <span className="ml-1 font-mono text-xs">
                ({sprint.story_ids.join(", ")})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
