"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CeremonyDialog,
  type SprintOption,
} from "@/components/ceremony/CeremonyDialog";
import {
  CeremonyHistory,
  type SprintItems,
} from "@/components/ceremony/CeremonyHistory";
import { RetroActionDialog } from "@/components/ceremony/RetroActionDialog";
import { ceremonyHistory } from "@/lib/ceremonies";
import { buildRetroActionTask } from "@/lib/retro-actions";
import { storiesForProject } from "@/lib/backlog";
import { useHydrated } from "@/lib/use-hydrated";
import { useBoardStore } from "@/store/useBoardStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useProjectStore } from "@/store/useProjectStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useSprintStore } from "@/store/useSprintStore";
import type { SprintRetro } from "@/types";

export default function CeremoniesPage() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const allStories = useBacklogStore((state) => state.stories);
  const teams = usePeopleStore((state) => state.teams);
  const persons = usePeopleStore((state) => state.persons);
  const sprints = useSprintStore((state) => state.sprints);
  const reviews = useSprintStore((state) => state.reviews);
  const retros = useSprintStore((state) => state.retros);
  const addReview = useSprintStore((state) => state.addReview);
  const addRetro = useSprintStore((state) => state.addRetro);
  const toggleCeremonyStory = useSprintStore((state) => state.toggleCeremonyStory);
  const toggleCeremonyTask = useSprintStore((state) => state.toggleCeremonyTask);
  const addCeremonyComment = useSprintStore((state) => state.addCeremonyComment);
  const removeCeremonyComment = useSprintStore(
    (state) => state.removeCeremonyComment,
  );
  const boardTasks = useBoardStore((state) => state.tasks);
  const addTask = useBoardStore((state) => state.addTask);

  const [kind, setKind] = useState<"review" | "retro" | null>(null);
  // The retro action the user is turning into a task (null = dialog closed).
  const [pendingAction, setPendingAction] = useState<{
    retro: SprintRetro;
    action: string;
  } | null>(null);

  const projectName = useMemo(() => {
    const byId = new Map(ideas.map((idea) => [idea.id, idea.name]));
    return (projectId: string) => byId.get(projectId) ?? "Unbekanntes Projekt";
  }, [ideas]);

  // Planned PT per sprint, derived from its assigned stories (never stored).
  const sprintOptions = useMemo<SprintOption[]>(() => {
    return sprints
      .map((sprint) => {
        const stories = storiesForProject(allStories, sprint.projectId);
        const byId = new Map(stories.map((story) => [story.id, story]));
        const plannedPt = sprint.storyIds.reduce(
          (sum, id) => sum + (byId.get(id)?.estimate_pt ?? 0),
          0,
        );
        return {
          id: sprint.id,
          label: `${projectName(sprint.projectId)} · ${sprint.name}`,
          plannedPt,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sprints, allStories, projectName]);

  const sprintLabelById = useMemo(() => {
    const byId = new Map(sprintOptions.map((option) => [option.id, option.label]));
    return (sprintId: string) => byId.get(sprintId) ?? "Gelöschter Sprint";
  }, [sprintOptions]);

  const entries = useMemo(
    () => ceremonyHistory(reviews, retros),
    [reviews, retros],
  );

  // Linkable stories/tasks of a sprint for the link picker (TASK-055).
  const sprintItems = useMemo(() => {
    return (sprintId: string): SprintItems => {
      const sprint = sprints.find((s) => s.id === sprintId);
      if (!sprint) return { stories: [], tasks: [] };
      const storyIds = new Set(sprint.storyIds);
      const stories = storiesForProject(allStories, sprint.projectId)
        .filter((story) => storyIds.has(story.id))
        .map((story) => ({ id: story.id, title: story.title }));
      const tasks = boardTasks
        .filter((task) => task.storyId !== undefined && storyIds.has(task.storyId))
        .map((task) => ({ id: task.id, title: task.title }));
      return { stories, tasks };
    };
  }, [sprints, allStories, boardTasks]);

  // Project (id + name) of the sprint a retro belongs to – needed to build the
  // task. Returns undefined when the sprint was deleted (robust, no crash).
  function projectOfRetro(retro: SprintRetro) {
    const sprint = sprints.find((s) => s.id === retro.sprintId);
    if (!sprint) return undefined;
    return { id: sprint.projectId, name: projectName(sprint.projectId) };
  }

  const pendingProjectName = pendingAction
    ? projectOfRetro(pendingAction.retro)?.name ?? "Unbekanntes Projekt"
    : "";

  function handleCreateActionTask(values: {
    title: string;
    assigneeId?: string;
    dueDate?: string;
  }) {
    if (!pendingAction) return;
    const project = projectOfRetro(pendingAction.retro);
    if (!project) return; // sprint gone – nothing to attach the task to
    addTask(
      buildRetroActionTask({
        retroId: pendingAction.retro.id,
        action: pendingAction.action,
        title: values.title,
        projectId: project.id,
        projectName: project.name,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate,
      }),
    );
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  const hasSprints = sprintOptions.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ceremonies"
        description="Reviews und Retrospektiven – chronologische Historie über alle Sprints."
        actions={
          hasSprints ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                data-testid="ceremony-new-review"
                onClick={() => setKind("review")}
              >
                Neue Review
              </Button>
              <Button
                variant="outline"
                data-testid="ceremony-new-retro"
                onClick={() => setKind("retro")}
              >
                Neue Retro
              </Button>
            </div>
          ) : null
        }
      />

      {!hasSprints ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <h2 className="text-base font-medium text-foreground">
              Noch keine Sprints
            </h2>
            <p className="max-w-md text-sm text-muted">
              Reviews und Retros beziehen sich auf Sprints. Lege zuerst einen
              Sprint an.
            </p>
            <Link href="/sprints" className={buttonVariants()}>
              Zu den Sprints
            </Link>
          </CardContent>
        </Card>
      ) : (
        <CeremonyHistory
          entries={entries}
          sprintLabel={sprintLabelById}
          teams={teams}
          sprintItems={sprintItems}
          boardTasks={boardTasks}
          onCreateActionTask={(retro, action) =>
            setPendingAction({ retro, action })
          }
          onToggleStory={toggleCeremonyStory}
          onToggleTask={toggleCeremonyTask}
          onAddComment={addCeremonyComment}
          onRemoveComment={removeCeremonyComment}
        />
      )}

      <CeremonyDialog
        open={kind !== null}
        kind={kind}
        sprints={sprintOptions}
        teams={teams}
        onOpenChange={(open) => {
          if (!open) setKind(null);
        }}
        onSaveReview={addReview}
        onSaveRetro={addRetro}
      />

      <RetroActionDialog
        action={pendingAction?.action ?? null}
        projectName={pendingProjectName}
        persons={persons}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        onCreate={handleCreateActionTask}
      />
    </div>
  );
}
