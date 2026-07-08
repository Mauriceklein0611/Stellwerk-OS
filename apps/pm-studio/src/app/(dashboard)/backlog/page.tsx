"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { BacklogTree, InlineAdd } from "@/components/backlog/BacklogTree";
import { BacklogFooter } from "@/components/backlog/BacklogFooter";
import { StoryDialog } from "@/components/backlog/StoryDialog";
import { AgentPanel } from "@/components/backlog/AgentPanel";
import { PipelineStepper } from "@/components/project/PipelineStepper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar, type FilterControl } from "@/components/common/FilterBar";
import {
  backlogSummary,
  epicsForProject,
  storiesForEpic,
  storiesForProject,
} from "@/lib/backlog";
import { severityBadge } from "@/lib/severity";
import { ALL } from "@/lib/board-filters";
import { useHydrated } from "@/lib/use-hydrated";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { stepStatusesForPhase } from "@/lib/pipeline-steps";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useCommandActionStore } from "@/store/useCommandActionStore";
import { useProposalStore } from "@/store/useProposalStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import type { Epic, Priority, UserStory } from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Release scope-filter sentinel for stories without a release (TASK-062). */
const NO_RELEASE = "__none__";

/** Read the `?project=<id>` deep-link once (TASK-057, basis for TASK-061). */
function initialProjectFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("project") ?? "";
}

/**
 * Read the `?plan=1` deep-link once (TASK-061): "Planung starten" on the project
 * detail opens the backlog with the agent panel already up.
 */
function initialPlanFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("plan") === "1";
}

export default function BacklogPage() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const allEpics = useBacklogStore((state) => state.epics);
  const allStories = useBacklogStore((state) => state.stories);
  const addEpic = useBacklogStore((state) => state.addEpic);
  const updateEpic = useBacklogStore((state) => state.updateEpic);
  const removeEpic = useBacklogStore((state) => state.removeEpic);
  const addStory = useBacklogStore((state) => state.addStory);
  const updateStory = useBacklogStore((state) => state.updateStory);
  const removeStory = useBacklogStore((state) => state.removeStory);
  const reorderStory = useBacklogStore((state) => state.reorderStory);
  const restoreBacklog = useBacklogStore((state) => state.restore);
  const tasks = useBoardStore((state) => state.tasks);
  const restoreBoard = useBoardStore((state) => state.restore);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const allReleases = useReleaseStore((state) => state.releases);
  const confirmDelete = useConfirmDelete();

  // "Neue Story" raised from the CommandBar pre-opens the first epic's add field.
  const wantNewStory = useCommandActionStore(
    (state) => state.intent === "new-story",
  );
  const clearIntent = useCommandActionStore((state) => state.clear);

  const [projectFilter, setProjectFilter] = useState<string>(
    initialProjectFromUrl,
  );
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL);
  const [releaseFilter, setReleaseFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [epicAddOpen, setEpicAddOpen] = useState(false);
  const [addStoryEpicId, setAddStoryEpicId] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<UserStory | null>(null);
  const [panelOpen, setPanelOpen] = useState(initialPlanFromUrl);

  const activeProjectId = projectFilter || ideas[0]?.id || "";
  const activeIdea = ideas.find((idea) => idea.id === activeProjectId) ?? null;

  // Guided-planning session of the active project drives the gate stepper.
  const planning = useProposalStore((state) => state.byProject[activeProjectId]);
  const planningPhase = planning?.phase ?? "idle";
  const stepStatuses = stepStatusesForPhase(
    planningPhase,
    (planning?.proposals.length ?? 0) > 0,
  );

  const projectEpics = useMemo(
    () => epicsForProject(allEpics, activeProjectId),
    [allEpics, activeProjectId],
  );
  const projectStories = useMemo(
    () => storiesForProject(allStories, activeProjectId),
    [allStories, activeProjectId],
  );
  const projectReleases = useMemo(
    () => allReleases.filter((release) => release.projectId === activeProjectId),
    [allReleases, activeProjectId],
  );

  const filterActive =
    priorityFilter !== ALL || releaseFilter !== ALL || query.trim() !== "";
  const filteredStories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projectStories.filter((story) => {
      if (priorityFilter !== ALL && story.priority !== priorityFilter) {
        return false;
      }
      if (releaseFilter !== ALL) {
        // "Ohne Release" matches unassigned stories; else match the exact id.
        const storyRelease = story.releaseId ?? NO_RELEASE;
        if (storyRelease !== releaseFilter) return false;
      }
      if (q && !story.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projectStories, priorityFilter, releaseFilter, query]);

  // While filtering, hide epics that have no matching story (keep all when idle
  // so empty epics stay addable).
  const visibleEpics = useMemo(() => {
    if (!filterActive) return projectEpics;
    const withMatch = new Set(filteredStories.map((story) => story.epicId));
    return projectEpics.filter((epic) => withMatch.has(epic.id));
  }, [projectEpics, filteredStories, filterActive]);

  const summary = useMemo(
    () => backlogSummary(filteredStories, tasks, boardColumns),
    [filteredStories, tasks, boardColumns],
  );

  // The add-story field: local override wins, else the palette intent opens the
  // first epic. Closing clears the intent so it can't re-open (TASK-042 pattern).
  const openAddStoryEpicId =
    addStoryEpicId ?? (wantNewStory ? projectEpics[0]?.id ?? null : null);
  function handleOpenAddStory(epicId: string | null) {
    setAddStoryEpicId(epicId);
    if (epicId === null) clearIntent();
  }

  const priorityControl: FilterControl = {
    id: "priority",
    label: "Priorität",
    value: priorityFilter,
    onChange: setPriorityFilter,
    options: [
      { value: ALL, label: "Alle Prioritäten" },
      ...PRIORITIES.map((priority) => ({
        value: priority,
        label: severityBadge(priority).label,
      })),
    ],
  };

  // Release scope filter (Octane fixVersion pattern); only when releases exist.
  const releaseControl: FilterControl = {
    id: "release",
    label: "Release",
    value: releaseFilter,
    onChange: setReleaseFilter,
    options: [
      { value: ALL, label: "Alle Releases" },
      { value: NO_RELEASE, label: "Ohne Release" },
      ...projectReleases.map((release) => ({
        value: release.id,
        label: release.name,
      })),
    ],
  };

  const filterControls =
    projectReleases.length > 0
      ? [priorityControl, releaseControl]
      : [priorityControl];

  function resetFilters() {
    setPriorityFilter(ALL);
    setReleaseFilter(ALL);
    setQuery("");
  }

  function handleAddEpic(title: string) {
    addEpic({
      id: crypto.randomUUID(),
      projectId: activeProjectId,
      title,
      rank: projectEpics.length,
    });
  }

  function handleAddStory(epicId: string, title: string) {
    addStory({
      id: crypto.randomUUID(),
      epicId,
      projectId: activeProjectId,
      title,
      acceptance_criteria: [],
      estimate_pt: 0,
      priority: "mittel",
      rank: storiesForEpic(allStories, epicId).length,
      provenance: "human",
    });
  }

  /** Empty-project CTA: spin up a default epic and open its story field. */
  function handleCreateFirstStory() {
    const id = crypto.randomUUID();
    addEpic({ id, projectId: activeProjectId, title: "Neues Epic", rank: 0 });
    setAddStoryEpicId(id);
  }

  function snapshotAndDelete(
    title: string,
    kind: "Epic" | "Story",
    perform: () => void,
  ) {
    const backlogBefore = {
      epics: useBacklogStore.getState().epics,
      stories: useBacklogStore.getState().stories,
    };
    const tasksBefore = useBoardStore.getState().tasks;
    void confirmDelete({
      confirm: {
        title: `${kind} „${title}“ löschen?`,
        description:
          kind === "Epic"
            ? "Das Epic und alle seine Stories werden gelöscht. Verknüpfte Board-Aufgaben bleiben erhalten."
            : "Die Story wird gelöscht. Verknüpfte Board-Aufgaben bleiben erhalten.",
      },
      toastMessage: `${kind} „${title}“ gelöscht.`,
      perform,
      undo: () => {
        restoreBacklog(backlogBefore);
        restoreBoard(tasksBefore);
      },
    });
  }

  function handleDeleteEpic(epic: Epic) {
    snapshotAndDelete(epic.title, "Epic", () => removeEpic(epic.id));
  }

  function handleDeleteStory(story: UserStory) {
    snapshotAndDelete(story.title, "Story", () => removeStory(story.id));
  }

  /** Edit-then-adopt (TASK-060): a proposal was accepted as human_edited and is
   *  now a real store story – open the story dialog on it. */
  function handleEditProposalStory(storyId: string) {
    const story = useBacklogStore.getState().stories.find((s) => s.id === storyId);
    if (story) setOpenStory(story);
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  const hasItems = projectEpics.length > 0 || projectStories.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Backlog"
        description="Epics und User Stories planen, priorisieren und in Aufgaben zerlegen."
        actions={
          ideas.length > 0 ? (
            <div className="flex items-center gap-2">
              <Select
                value={activeProjectId}
                onValueChange={(value) => setProjectFilter(value ?? "")}
              >
                <SelectTrigger className="w-56">
                  <SelectValue>
                    {(value) =>
                      ideas.find((idea) => idea.id === value)?.name ??
                      "Projekt wählen"
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
              <Button
                variant="outline"
                data-testid="backlog-open-agent"
                onClick={() => setPanelOpen(true)}
              >
                <Sparkles aria-hidden />
                Planung mit Agent
              </Button>
            </div>
          ) : null
        }
      />

      {planningPhase !== "idle" && (
        <div
          data-testid="backlog-pipeline-stepper"
          className="rounded-xl border border-border bg-surface px-3 py-2"
        >
          <PipelineStepper statuses={stepStatuses} onStepClick={() => {}} />
        </div>
      )}

      {ideas.length === 0 ? (
        <EmptyCard
          title="Noch keine Projekte"
          text="Leg zuerst eine Projektidee an, um ein Backlog zu füllen."
          ctaHref="/ideas/new"
          ctaLabel="Erste Idee anlegen"
        />
      ) : !hasItems ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <h2 className="text-base font-medium text-foreground">
              Noch kein Backlog
            </h2>
            <p className="max-w-md text-sm text-muted">
              Lege deine erste Story von Hand an oder starte später die Planung
              mit dem Agenten.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                data-testid="backlog-create-first-story"
                onClick={handleCreateFirstStory}
              >
                Story manuell anlegen
              </Button>
              <Button
                variant="outline"
                data-testid="backlog-empty-open-agent"
                onClick={() => setPanelOpen(true)}
              >
                Planung mit Agent starten
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterBar
              controls={filterControls}
              active={filterActive}
              onReset={resetFilters}
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Stories durchsuchen …"
              aria-label="Backlog durchsuchen"
              data-testid="backlog-search"
              className="h-9 w-full max-w-xs"
            />
            <div className="ml-auto">
              <InlineAdd
                open={epicAddOpen}
                onOpenChange={setEpicAddOpen}
                onSubmit={handleAddEpic}
                triggerLabel="Epic hinzufügen"
                placeholder="Epic-Titel … (Enter)"
                testId="backlog-add-epic"
              />
            </div>
          </div>

          {filterActive && filteredStories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="max-w-md text-sm text-muted">
                  Keine Stories für die aktuellen Filter.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Filter zurücksetzen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <BacklogTree
                epics={visibleEpics}
                stories={filteredStories}
                tasks={tasks}
                releases={projectReleases}
                columns={boardColumns}
                onRenameEpic={(id, title) => updateEpic(id, { title })}
                onDeleteEpic={handleDeleteEpic}
                onAddStory={handleAddStory}
                onUpdateStory={updateStory}
                onDeleteStory={handleDeleteStory}
                onOpenStory={setOpenStory}
                onReorderStory={reorderStory}
                openAddStoryEpicId={openAddStoryEpicId}
                onOpenAddStory={handleOpenAddStory}
              />
              <BacklogFooter summary={summary} />
            </>
          )}
        </div>
      )}

      <StoryDialog
        story={openStory}
        onOpenChange={(open) => !open && setOpenStory(null)}
      />

      <AgentPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        idea={activeIdea}
        onEditStory={handleEditProposalStory}
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
