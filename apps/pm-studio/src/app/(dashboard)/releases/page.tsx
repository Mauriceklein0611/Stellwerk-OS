"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import {
  ReleaseDialog,
  type ReleaseFormValues,
} from "@/components/release/ReleaseDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateSprints,
  releaseProgress,
  releaseScope,
  releaseSprints,
} from "@/lib/release";
import { terminalColumnIds } from "@/lib/board";
import { storiesForProject } from "@/lib/backlog";
import { useHydrated } from "@/lib/use-hydrated";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useBoardStore } from "@/store/useBoardStore";
import { useCommandActionStore } from "@/store/useCommandActionStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import { useSprintStore } from "@/store/useSprintStore";
import type { Release, UserStory } from "@/types";

export default function ReleasesPage() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const allStories = useBacklogStore((state) => state.stories);
  const restoreBacklog = useBacklogStore((state) => state.restore);
  const boardTasks = useBoardStore((state) => state.tasks);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const releases = useReleaseStore((state) => state.releases);
  const addRelease = useReleaseStore((state) => state.addRelease);
  const updateRelease = useReleaseStore((state) => state.updateRelease);
  const removeRelease = useReleaseStore((state) => state.removeRelease);
  const sprints = useSprintStore((state) => state.sprints);
  const setReleaseSprints = useSprintStore((state) => state.setReleaseSprints);
  const detachRelease = useSprintStore((state) => state.detachRelease);
  const restoreReleases = useReleaseStore((state) => state.restore);
  const restoreSprints = useSprintStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();
  // "Neues Release" raised from the CommandBar opens the dialog declaratively –
  // but only when a project exists to attach it to.
  const newReleaseIntent = useCommandActionStore(
    (state) => state.intent === "new-release",
  );
  const clearIntent = useCommandActionStore((state) => state.clear);

  const [projectFilter, setProjectFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

  const activeProjectId = projectFilter || ideas[0]?.id || "";

  // Open when toggled locally or requested from the palette; closing clears both.
  const releaseDialogOpen = dialogOpen || (newReleaseIntent && ideas.length > 0);
  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) clearIntent();
  }

  const projectReleases = useMemo(
    () => releases.filter((release) => release.projectId === activeProjectId),
    [releases, activeProjectId],
  );

  // Project backlog stories – the basis for each release's computed scope/progress.
  const stories = useMemo<UserStory[]>(
    () => storiesForProject(allStories, activeProjectId),
    [allStories, activeProjectId],
  );

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

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

  /** Build a Release from form values, then (re-)generate its sprints. */
  function regenerate(release: Release) {
    setReleaseSprints(release.id, generateSprints(release));
  }

  function handleCreate(values: ReleaseFormValues) {
    const release: Release = { id: crypto.randomUUID(), ...values };
    addRelease(release);
    regenerate(release);
  }

  function handleUpdate(id: string, patch: Partial<ReleaseFormValues>) {
    updateRelease(id, patch);
    const current = releases.find((release) => release.id === id);
    if (current) regenerate({ ...current, ...patch });
  }

  function handleDelete(id: string) {
    const release = releases.find((r) => r.id === id);
    if (!release) return;
    // Snapshot releases + sprints + backlog (all lose their releaseId link on
    // delete) so Undo restores the assignments 1:1 (TASK-062).
    const releasesBefore = useReleaseStore.getState().releases;
    const sprintsBefore = useSprintStore.getState().sprints;
    const backlogBefore = {
      epics: useBacklogStore.getState().epics,
      stories: useBacklogStore.getState().stories,
    };
    void confirmDelete({
      confirm: {
        title: `Release „${release.name}“ löschen?`,
        description:
          "Das Release wird gelöscht; die erzeugten Sprints und zugeordneten Stories bleiben erhalten, verlieren aber ihre Release-Zuordnung.",
      },
      toastMessage: `Release „${release.name}“ gelöscht.`,
      perform: () => {
        detachRelease(id); // keep the sprints, just unlink them
        removeRelease(id); // cascades releaseId off the stories, too
      },
      undo: () => {
        restoreReleases(releasesBefore);
        restoreSprints(sprintsBefore);
        restoreBacklog(backlogBefore);
      },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Releases"
        description="Lieferzeiträume verwalten – datierte Sprints werden automatisch erzeugt."
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
                onClick={() => {
                  setEditingRelease(null);
                  setDialogOpen(true);
                }}
              >
                Neues Release
              </Button>
            </div>
          ) : null
        }
      />

      {ideas.length === 0 ? (
        <EmptyCard
          title="Noch keine Projekte"
          text="Leg zuerst eine Projektidee an, um Releases planen zu können."
          ctaHref="/ideas/new"
          ctaLabel="Erste Idee anlegen"
        />
      ) : projectReleases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="max-w-md text-sm text-muted">
              Noch keine Releases für dieses Projekt. Lege ein Release mit Zeitraum
              und Sprint-Dauer an – die Sprints werden automatisch erzeugt.
            </p>
            <Button
              onClick={() => {
                setEditingRelease(null);
                setDialogOpen(true);
              }}
            >
              Erstes Release anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projectReleases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              progress={releaseProgress(
                release.id,
                sprints,
                stories,
                boardTasks,
                terminalColumns,
              )}
              scope={releaseScope(
                release.id,
                stories,
                boardTasks,
                terminalColumns,
              )}
              sprints={releaseSprints(release.id, sprints)}
              today={today}
              onEdit={() => {
                setEditingRelease(release);
                setDialogOpen(true);
              }}
              onRegenerate={() => regenerate(release)}
            />
          ))}
        </div>
      )}

      <ReleaseDialog
        open={releaseDialogOpen}
        release={newReleaseIntent ? null : editingRelease}
        projects={ideas}
        defaultProjectId={activeProjectId}
        onOpenChange={handleDialogOpenChange}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
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
