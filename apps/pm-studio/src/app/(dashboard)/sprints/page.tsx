"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { PageHeader } from "@/components/layout/PageHeader";
import { SprintSection } from "@/components/sprint/SprintSection";
import { SprintDialog } from "@/components/sprint/SprintDialog";
import { SprintReviewDialog } from "@/components/sprint/SprintReviewDialog";
import { StoryDialog } from "@/components/backlog/StoryDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar, type FilterControl } from "@/components/common/FilterBar";
import { createReview, createRetro } from "@/lib/ceremonies";
import { storiesForProject } from "@/lib/backlog";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useSprintStore } from "@/store/useSprintStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useHydrated } from "@/lib/use-hydrated";
import { terminalColumnIds } from "@/lib/board";
import { SPRINT_STATUS, SPRINT_STATUS_ORDER } from "@/lib/sprint";
import {
  ALL,
  DONE,
  OPEN,
  UNASSIGNED as FILTER_UNASSIGNED,
  emptySprintViewFilter,
  isSprintViewFilterActive,
  sprintStatusMatches,
  storyMatchesFilter,
  type SprintViewFilter,
} from "@/lib/board-filters";
import type { PlannedSprint, UserStory } from "@/types";

const UNASSIGNED = "unassigned";

export default function SprintsPage() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const artifacts = useProjectStore((state) => state.artifacts);
  const allStories = useBacklogStore((state) => state.stories);
  const boardTasks = useBoardStore((state) => state.tasks);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const persons = usePeopleStore((state) => state.persons);
  const sprints = useSprintStore((state) => state.sprints);
  const addSprint = useSprintStore((state) => state.addSprint);
  const updateSprint = useSprintStore((state) => state.updateSprint);
  const removeSprint = useSprintStore((state) => state.removeSprint);
  const assignStory = useSprintStore((state) => state.assignStory);
  const importSuggestions = useSprintStore((state) => state.importSuggestions);
  const addReview = useSprintStore((state) => state.addReview);
  const addRetro = useSprintStore((state) => state.addRetro);

  const [projectFilter, setProjectFilter] = useState("");
  const [viewFilter, setViewFilter] = useState<SprintViewFilter>(
    emptySprintViewFilter,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<PlannedSprint | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewingSprint, setReviewingSprint] = useState<PlannedSprint | null>(null);
  const [openStory, setOpenStory] = useState<UserStory | null>(null);

  const activeProjectId = projectFilter || ideas[0]?.id || "";
  const activeArtifacts = artifacts[activeProjectId];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stories = useMemo<UserStory[]>(
    () => storiesForProject(allStories, activeProjectId),
    [allStories, activeProjectId],
  );

  const projectSprints = useMemo(
    () =>
      sprints
        .filter((sprint) => sprint.projectId === activeProjectId)
        .sort((a, b) => a.order - b.order),
    [sprints, activeProjectId],
  );

  const columns = useMemo(() => {
    const byId = new Map(stories.map((story) => [story.id, story]));
    const assigned = new Set(projectSprints.flatMap((sprint) => sprint.storyIds));

    // Sprints stacked first, the backlog ("unassigned") section last (TASK-059).
    return [
      ...projectSprints.map((sprint) => ({
        id: sprint.id,
        label: sprint.name,
        sprint,
        stories: sprint.storyIds
          .map((id) => byId.get(id))
          .filter((story): story is UserStory => Boolean(story)),
      })),
      {
        id: UNASSIGNED,
        label: "Backlog / Nicht zugeordnet",
        sprint: undefined as PlannedSprint | undefined,
        stories: stories.filter((story) => !assigned.has(story.id)),
      },
    ];
  }, [stories, projectSprints]);

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

  // Planned PT of the sprint under review, derived from its assigned stories.
  const reviewingPlannedPt = useMemo(() => {
    if (!reviewingSprint) return 0;
    const byId = new Map(stories.map((story) => [story.id, story]));
    return reviewingSprint.storyIds.reduce(
      (sum, id) => sum + (byId.get(id)?.estimate_pt ?? 0),
      0,
    );
  }, [reviewingSprint, stories]);

  const filteredColumns = useMemo(
    () =>
      columns
        .filter((column) =>
          column.sprint
            ? sprintStatusMatches(column.sprint.status, viewFilter)
            : viewFilter.sprintStatus === ALL,
        )
        .map((column) => ({
          ...column,
          stories: column.stories.filter((story) =>
            storyMatchesFilter(story, viewFilter, boardTasks, terminalColumns),
          ),
        })),
    [columns, viewFilter, boardTasks, terminalColumns],
  );

  const filterActive = isSprintViewFilterActive(viewFilter);
  const visibleStoryCount = filteredColumns.reduce(
    (sum, column) => sum + column.stories.length,
    0,
  );

  const filterControls: FilterControl[] = [
    {
      id: "person",
      label: "Person",
      value: viewFilter.assigneeId,
      onChange: (assigneeId) =>
        setViewFilter((current) => ({ ...current, assigneeId })),
      options: [
        { value: ALL, label: "Alle Personen" },
        { value: FILTER_UNASSIGNED, label: "Nicht zugewiesen" },
        ...persons.map((person) => ({ value: person.id, label: person.name })),
      ],
    },
    {
      id: "sprint-status",
      label: "Sprint-Status",
      value: viewFilter.sprintStatus,
      onChange: (sprintStatus) =>
        setViewFilter((current) => ({ ...current, sprintStatus })),
      options: [
        { value: ALL, label: "Alle Sprint-Status" },
        ...SPRINT_STATUS_ORDER.map((status) => ({
          value: status,
          label: SPRINT_STATUS[status].label,
        })),
      ],
    },
    {
      id: "done",
      label: "Item-Status",
      value: viewFilter.done,
      onChange: (done) => setViewFilter((current) => ({ ...current, done })),
      options: [
        { value: ALL, label: "Alle Items" },
        { value: DONE, label: "Erledigt" },
        { value: OPEN, label: "Offen" },
      ],
    },
  ];

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  // Local "today" as ISO date – only reached after the hydration gate above,
  // so it never runs during SSR and can't cause a hydration mismatch.
  const today = new Date().toLocaleDateString("sv-SE"); // sv-SE → YYYY-MM-DD

  function columnOfStory(storyId: string): string {
    const sprint = projectSprints.find((s) => s.storyIds.includes(storyId));
    return sprint ? sprint.id : UNASSIGNED;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const storyId = String(active.id);
    const overId = String(over.id);

    const target = columns.some((column) => column.id === overId)
      ? overId
      : columnOfStory(overId);

    if (target === columnOfStory(storyId)) return;
    assignStory(storyId, target === UNASSIGNED ? null : target);
  }

  const suggestions = activeArtifacts?.backlog.sprint_suggestions ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Sprints"
        description="Sprints planen – Backlog-Stories per Drag & Drop zuordnen."
        actions={
          ideas.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={activeProjectId}
                onValueChange={(value) => setProjectFilter(value ?? "")}
              >
                <SelectTrigger className="w-56">
                  <SelectValue>
                    {(value) =>
                      ideas.find((idea) => idea.id === value)?.name ?? "Projekt wählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ideas.map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suggestions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => importSuggestions(activeProjectId, suggestions)}
                >
                  Aus Vorschlägen übernehmen
                </Button>
              )}
              <Button
                disabled={!activeProjectId}
                onClick={() => {
                  setEditingSprint(null);
                  setDialogOpen(true);
                }}
              >
                Neuer Sprint
              </Button>
            </div>
          ) : null
        }
      />

      {ideas.length === 0 ? (
        <EmptyCard
          title="Noch keine Projekte"
          text="Leg zuerst eine Projektidee an, um Sprints planen zu können."
          ctaHref="/ideas/new"
          ctaLabel="Erste Idee anlegen"
        />
      ) : stories.length === 0 ? (
        <EmptyCard
          title="Noch kein Backlog"
          text="Für dieses Projekt gibt es noch keine User Stories. Führe zuerst die Pipeline aus oder lege Stories im Projekt an."
          ctaHref={`/projects/${activeProjectId}`}
          ctaLabel="Projekt öffnen"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterBar
            controls={filterControls}
            active={filterActive}
            onReset={() => setViewFilter(emptySprintViewFilter)}
          />

          {filterActive && visibleStoryCount === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="max-w-md text-sm text-muted">
                  Keine Items für die aktuellen Filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setViewFilter(emptySprintViewFilter)}
                >
                  Filter zurücksetzen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col gap-3">
                {filteredColumns.map((column) => (
                  <SprintSection
                    key={column.id}
                    id={column.id}
                    label={column.label}
                    goal={column.sprint?.goal}
                    sprint={column.sprint}
                    stories={column.stories}
                    boardTasks={boardTasks}
                    persons={persons}
                    terminalColumns={terminalColumns}
                    today={today}
                    detailHref={
                      column.sprint ? `/sprints/${column.sprint.id}` : undefined
                    }
                    onStoryClick={setOpenStory}
                    onEdit={
                      column.sprint
                        ? () => {
                            setEditingSprint(column.sprint ?? null);
                            setDialogOpen(true);
                          }
                        : undefined
                    }
                    onReview={
                      column.sprint &&
                      (column.sprint.status === "active" ||
                        column.sprint.status === "done")
                        ? () => {
                            setReviewingSprint(column.sprint ?? null);
                            setReviewOpen(true);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </DndContext>
          )}
        </div>
      )}

      <SprintDialog
        open={dialogOpen}
        sprint={editingSprint}
        onOpenChange={setDialogOpen}
        onCreate={(values) =>
          addSprint({
            id: crypto.randomUUID(),
            projectId: activeProjectId,
            storyIds: [],
            ...values,
          })
        }
        onUpdate={updateSprint}
        onDelete={removeSprint}
      />

      <SprintReviewDialog
        open={reviewOpen}
        sprint={reviewingSprint}
        plannedPt={reviewingPlannedPt}
        onOpenChange={setReviewOpen}
        onSaveReview={(content) => {
          addReview(createReview(content, { scope: "project" }));
          setReviewOpen(false);
        }}
        onSaveRetro={(content) => {
          addRetro(createRetro(content, { scope: "project" }));
          setReviewOpen(false);
        }}
      />

      <StoryDialog
        story={openStory}
        onOpenChange={(open) => !open && setOpenStory(null)}
      />
    </div>
  );
}

function EmptyCard({
  title,
  text,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  text: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        <p className="max-w-md text-sm text-muted">{text}</p>
        <Link href={ctaHref} className={buttonVariants()}>
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
