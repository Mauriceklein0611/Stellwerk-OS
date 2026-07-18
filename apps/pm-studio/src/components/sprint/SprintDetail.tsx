"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { SprintBurndownChart } from "@/components/dashboard/charts/SprintBurndownChart";
import { TaskDialog } from "@/components/board/TaskDialog";
import { StoryDialog } from "@/components/backlog/StoryDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useSprintStore } from "@/store/useSprintStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useHydrated } from "@/lib/use-hydrated";
import { terminalColumnIds, columnLabel, columnStatus } from "@/lib/board";
import { ceremonyHistory, scopeLabel } from "@/lib/ceremonies";
import { SPRINT_STATUS, formatSprintRange, isActiveSprint } from "@/lib/sprint";
import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import { sprintBurndown } from "@/lib/burndown";
import { tasksForStory } from "@/lib/story-tasks";
import { initials } from "@/lib/people";
import { severityBadge } from "@/lib/severity";
import type { BoardTask, UserStory } from "@/types";

/**
 * Standalone sprint detail page (TASK-053): a sprint as its own overview and
 * work surface instead of one column among many. Header (goal, timebox,
 * progress) + burndown + a clickable story/task list that opens the same
 * `TaskDialog` as the board. All done/progress logic reuses the single sources
 * `sprintProgress`/`sprintBurndown`/`isStoryDone` (TASK-038) – no second logic.
 */
export function SprintDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const sprint = useSprintStore((state) => state.sprints.find((s) => s.id === id));
  const reviews = useSprintStore((state) => state.reviews);
  const retros = useSprintStore((state) => state.retros);
  const teams = usePeopleStore((state) => state.teams);
  const allStories = useBacklogStore((state) => state.stories);
  const boardTasks = useBoardStore((state) => state.tasks);
  const updateTask = useBoardStore((state) => state.updateTask);
  const removeTask = useBoardStore((state) => state.removeTask);
  const restoreTasks = useBoardStore((state) => state.restore);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const persons = usePeopleStore((state) => state.persons);
  const confirmDelete = useConfirmDelete();

  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

  // Backlog stories of the sprint's project – the source for estimates + titles.
  const stories = useMemo<UserStory[]>(
    () =>
      sprint
        ? allStories.filter((story) => story.projectId === sprint.projectId)
        : [],
    [sprint, allStories],
  );

  // Reviews/retros of this sprint (TASK-065), newest first, linked to /ceremonies.
  const ceremonies = useMemo(
    () =>
      ceremonyHistory(
        reviews.filter((review) => review.sprintId === id),
        retros.filter((retro) => retro.sprintId === id),
      ),
    [reviews, retros, id],
  );

  const assignedStories = useMemo<UserStory[]>(() => {
    if (!sprint) return [];
    const byId = new Map(stories.map((story) => [story.id, story]));
    return sprint.storyIds
      .map((storyId) => byId.get(storyId))
      .filter((story): story is UserStory => Boolean(story));
  }, [sprint, stories]);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  if (!sprint) {
    return (
      <div
        data-testid="sprint-detail-not-found"
        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center"
      >
        <p className="text-sm text-muted">Sprint nicht gefunden.</p>
        <Button nativeButton={false} render={<Link href="/sprints" />}>
          Zu den Sprints
        </Button>
      </div>
    );
  }

  // Local "today" as ISO date – only reached past the hydration gate, so the
  // burndown/active badge never run during SSR (TASK-024/026 pattern).
  const today = new Date().toLocaleDateString("sv-SE"); // sv-SE → YYYY-MM-DD

  const progress = sprintProgress(sprint, assignedStories, boardTasks, terminalColumns);
  const burndown = sprintBurndown(sprint, assignedStories, boardTasks, today, terminalColumns);
  const range = formatSprintRange(sprint);
  const active = isActiveSprint(sprint, today);

  function handleDeleteTask(taskId: string) {
    const task = boardTasks.find((t) => t.id === taskId);
    if (!task) return;
    const tasksBefore = useBoardStore.getState().tasks;
    void confirmDelete({
      confirm: {
        title: `Task „${task.title}“ löschen?`,
        description: "Der Task wird vom Board entfernt.",
      },
      toastMessage: `Task „${task.title}“ gelöscht.`,
      perform: () => removeTask(taskId),
      undo: () => restoreTasks(tasksBefore),
    });
  }

  return (
    <div data-testid="sprint-detail" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/sprints"
          className="inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Sprints
        </Link>

        <PageHeader
          title={sprint.name}
          description={sprint.goal || "Kein Sprint-Ziel hinterlegt."}
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              {active && <StatusBadge status="running" label="Aktiv" />}
              <StatusBadge
                status={SPRINT_STATUS[sprint.status].status}
                label={SPRINT_STATUS[sprint.status].label}
              />
            </div>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fortschritt</CardTitle>
            {range && <p className="font-mono text-xs text-muted">{range}</p>}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">Erledigt / geplant</span>
              <span
                data-testid="sprint-detail-points"
                className="font-mono text-foreground"
              >
                {progress.donePt} / {progress.plannedPt} PT · {progress.doneCount}/
                {progress.total} Stories
              </span>
            </div>
            {progress.plannedPt > 0 ? (
              <ProgressBar
                value={progress.donePt}
                max={progress.plannedPt}
                status="success"
                label={`Sprint-Fortschritt ${sprint.name}: ${progress.donePt} von ${progress.plannedPt} PT erledigt`}
              />
            ) : (
              <p className="text-sm text-muted">
                Noch keine Stories mit Schätzung zugeordnet.
              </p>
            )}
          </CardContent>
        </Card>

        <SprintBurndownChart data={burndown} subtitle={sprint.name} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stories &amp; Aufgaben</CardTitle>
          <p className="text-xs text-muted">
            Aufgaben anklicken, um sie im Task-Dialog zu bearbeiten.
          </p>
        </CardHeader>
        <CardContent>
          {assignedStories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Diesem Sprint sind noch keine Stories zugeordnet – ordne sie auf der
              Sprint-Planung per Drag &amp; Drop zu.
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {assignedStories.map((story) => {
                const storyTasks = tasksForStory(story.id, boardTasks, boardColumns);
                const done = isStoryDone(story.id, boardTasks, terminalColumns);
                const priority = severityBadge(story.priority);
                return (
                  <li
                    key={story.id}
                    data-testid={`sprint-detail-story-${story.id}`}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`sprint-detail-story-open-${story.id}`}
                        onClick={() => setSelectedStory(story)}
                        className="flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface-hover"
                      >
                        <StatusBadge status={priority.status} label={priority.label} />
                        <span className="truncate text-sm font-medium text-foreground">
                          {story.title}
                        </span>
                        {done && <StatusBadge status="success" label="Fertig" />}
                      </button>
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {story.estimate_pt} PT
                      </span>
                    </div>

                    {storyTasks.length === 0 ? (
                      <p className="pl-1 text-xs text-muted">
                        Noch keine Aufgaben – im Backlog zerlegen.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {storyTasks.map((task) => {
                          const badge = severityBadge(task.priority);
                          const assignee = persons.find(
                            (person) => person.id === task.assigneeId,
                          );
                          return (
                            <li key={task.id}>
                              <button
                                type="button"
                                data-testid={`sprint-detail-task-${task.id}`}
                                onClick={() => setSelectedTask(task)}
                                className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-left text-sm transition-colors hover:border-foreground/30 hover:bg-surface-hover"
                              >
                                <StatusBadge
                                  status={columnStatus(task.column, boardColumns)}
                                  label={columnLabel(task.column, boardColumns)}
                                />
                                <span className="min-w-0 flex-1 truncate text-foreground">
                                  {task.title}
                                </span>
                                {assignee && (
                                  <span
                                    aria-hidden
                                    title={assignee.name}
                                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.6rem] font-medium text-foreground/80"
                                  >
                                    {initials(assignee.name)}
                                  </span>
                                )}
                                {typeof task.estimate_pt === "number" && (
                                  <span className="shrink-0 font-mono text-xs text-muted">
                                    {task.estimate_pt} PT
                                  </span>
                                )}
                                <StatusBadge status={badge.status} label={badge.label} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Ceremonies</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/ceremonies" />}
            >
              <ClipboardList className="mr-1 size-3.5" />
              Zu den Ceremonies
            </Button>
          </div>
          <p className="text-xs text-muted">
            Reviews und Retros dieses Sprints.
          </p>
        </CardHeader>
        <CardContent>
          {ceremonies.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
              Noch keine Reviews oder Retros für diesen Sprint.
            </p>
          ) : (
            <ul className="flex flex-col gap-2" data-testid="sprint-detail-ceremonies">
              {ceremonies.map((entry) => {
                const base =
                  entry.kind === "review" ? entry.review : entry.retro;
                return (
                  <li key={base.id}>
                    <Link
                      href="/ceremonies"
                      data-testid={`sprint-detail-ceremony-${base.id}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-surface-hover"
                    >
                      <StatusBadge
                        status={entry.kind === "review" ? "info" : "success"}
                        label={entry.kind === "review" ? "Review" : "Retro"}
                      />
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted">
                        {scopeLabel(base.scope, base.teamId, teams)}
                      </span>
                      <span className="ml-auto font-mono text-xs text-muted">
                        {formatCeremonyDate(base.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onSave={updateTask}
        onDelete={handleDeleteTask}
      />

      <StoryDialog
        story={selectedStory}
        onOpenChange={(open) => !open && setSelectedStory(null)}
      />
    </div>
  );
}

/** Epoch marks a legacy TASK-018 ceremony migrated without a real timestamp. */
const LEGACY_CREATED_AT = new Date(0).toISOString();

function formatCeremonyDate(createdAt: string): string {
  if (createdAt === LEGACY_CREATED_AT) return "Datum unbekannt";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Datum unbekannt";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
