"use client";

import { useState } from "react";
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";

import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
import { StoryTasks } from "@/components/project/StoryTasks";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import {
  acceptanceComplete,
  acceptanceProgress,
  addAcceptanceCriterion,
  normalizeAcceptance,
  removeAcceptanceCriterion,
  renameAcceptanceCriterion,
  toggleAcceptanceCriterion,
} from "@/lib/acceptance";
import { epicsForProject } from "@/lib/backlog";
import { severityBadge } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import type { AcceptanceCriterion, Priority, UserStory } from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Sentinel select value for "no release" (base-ui Select needs a string). */
const NO_RELEASE = "__none__";

type StoryDialogProps = {
  /** The story to view/edit; null closes the dialog. */
  story: UserStory | null;
  onOpenChange: (open: boolean) => void;
};

type StoryFormProps = {
  story: UserStory;
  onClose: () => void;
};

/**
 * Fields for one story. Keyed by story.id in the parent so it remounts (and
 * re-initializes its local state) whenever a different story is opened.
 */
function StoryForm({ story, onClose }: StoryFormProps) {
  const allEpics = useBacklogStore((state) => state.epics);
  const updateStory = useBacklogStore((state) => state.updateStory);
  const moveStoryToEpic = useBacklogStore((state) => state.moveStoryToEpic);
  const removeStory = useBacklogStore((state) => state.removeStory);
  const restoreBacklog = useBacklogStore((state) => state.restore);
  const restoreBoard = useBoardStore((state) => state.restore);
  const ideas = useProjectStore((state) => state.ideas);
  const allReleases = useReleaseStore((state) => state.releases);
  const itemKey = useItemKeyStore((state) => state.keys[story.id]);
  const confirmDelete = useConfirmDelete();

  const epics = epicsForProject(allEpics, story.projectId);
  const releases = allReleases.filter(
    (release) => release.projectId === story.projectId,
  );
  const projectName =
    ideas.find((idea) => idea.id === story.projectId)?.name ?? "";

  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description ?? "");
  const [epicId, setEpicId] = useState(story.epicId);
  const [priority, setPriority] = useState<Priority>(story.priority);
  const [releaseId, setReleaseId] = useState(story.releaseId ?? NO_RELEASE);
  const [pt, setPt] = useState(String(story.estimate_pt));
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>(
    story.acceptance_criteria,
  );
  const [newCriterion, setNewCriterion] = useState("");

  const addCriterion = () => {
    const next = addAcceptanceCriterion(criteria, newCriterion);
    if (next !== criteria) setNewCriterion("");
    setCriteria(next);
  };

  const progress = acceptanceProgress(criteria);

  function handleSave() {
    // Epic move is a dedicated action (re-ranks into the target epic); other
    // fields go through the normal patch. Order doesn't matter – both persist.
    if (epicId !== story.epicId) moveStoryToEpic(story.id, epicId);
    const parsed = Number(pt.trim());
    updateStory(story.id, {
      title: title.trim() || story.title,
      description: description.trim() || undefined,
      priority,
      releaseId: releaseId === NO_RELEASE ? undefined : releaseId,
      estimate_pt: Number.isFinite(parsed) && parsed >= 0 ? parsed : story.estimate_pt,
      acceptance_criteria: normalizeAcceptance(criteria),
    });
    onClose();
  }

  function handleDelete() {
    const backlogBefore = {
      epics: useBacklogStore.getState().epics,
      stories: useBacklogStore.getState().stories,
    };
    const tasksBefore = useBoardStore.getState().tasks;
    void confirmDelete({
      confirm: {
        title: `Story „${story.title}" löschen?`,
        description:
          "Die Story wird gelöscht. Verknüpfte Board-Aufgaben bleiben erhalten.",
      },
      toastMessage: `Story „${story.title}" gelöscht.`,
      perform: () => removeStory(story.id),
      undo: () => {
        restoreBacklog(backlogBefore);
        restoreBoard(tasksBefore);
      },
    }).then((deleted) => {
      if (deleted) onClose();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Story bearbeiten</DialogTitle>
        {(itemKey || projectName) && (
          <DialogDescription>
            {itemKey && <span className="font-mono">{itemKey}</span>}
            {itemKey && projectName && " · "}
            {projectName}
          </DialogDescription>
        )}
      </DialogHeader>

      {/* min-w-0: this div is a CSS-grid item of DialogContent (default
          min-width:auto). Without it a wide descendant (e.g. a story task row)
          keeps the grid track from shrinking, so the dialog overflows sideways
          and overflow-y-auto renders a horizontal scrollbar (TASK-058 bugfix). */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="story-title">Titel</Label>
          <Input
            id="story-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="story-description">Beschreibung</Label>
          <Textarea
            id="story-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Epic</Label>
            <Select value={epicId} onValueChange={(value) => setEpicId(value ?? epicId)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => epics.find((epic) => epic.id === value)?.title}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Priorität</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => severityBadge(value as Priority).label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {severityBadge(p).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-20 flex-col gap-1.5">
            <Label htmlFor="story-pt">PT</Label>
            <Input
              id="story-pt"
              type="number"
              min="0"
              step="0.5"
              value={pt}
              onChange={(event) => setPt(event.target.value)}
            />
          </div>
        </div>

        {/* Release scope (TASK-062): assign this story to a release / clear it. */}
        <div className="flex flex-col gap-1.5">
          <Label>Release</Label>
          <Select
            value={releaseId}
            onValueChange={(value) => setReleaseId(value ?? releaseId)}
          >
            <SelectTrigger className="w-full" aria-label="Release">
              <SelectValue>
                {(value) =>
                  value === NO_RELEASE
                    ? "Kein Release"
                    : releases.find((release) => release.id === value)?.name ??
                      "Kein Release"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RELEASE}>Kein Release</SelectItem>
              {releases.map((release) => (
                <SelectItem key={release.id} value={release.id}>
                  {release.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ac-new">Akzeptanzkriterien</Label>
            {progress.total > 0 && (
              <span
                data-testid="ac-dialog-progress"
                className="inline-flex items-center gap-1 text-xs text-muted"
              >
                <ListChecks className="size-3.5" aria-hidden />
                {progress.done}/{progress.total}
              </span>
            )}
          </div>

          {progress.total > 0 && (
            <>
              <ProgressBar
                value={progress.done}
                max={progress.total}
                status={acceptanceComplete(criteria) ? "success" : "info"}
                label={`Akzeptanzkriterien: ${progress.done} von ${progress.total} erfüllt`}
              />
              <ul className="flex flex-col gap-1.5">
                {criteria.map((item) => (
                  <li
                    key={item.id}
                    data-testid={`ac-item-${item.id}`}
                    className="flex items-start gap-2"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={item.done}
                      aria-label={`„${item.text}" als erfüllt markieren`}
                      onClick={() =>
                        setCriteria((current) =>
                          toggleAcceptanceCriterion(current, item.id),
                        )
                      }
                      className={cn(
                        "mt-1 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                        item.done
                          ? "border-success bg-success/10 text-success"
                          : "border-border text-transparent hover:border-foreground/40",
                      )}
                    >
                      <Check className="size-3.5" aria-hidden />
                    </button>
                    {/* Auto-growing field (field-sizing-content): the full
                        criterion text stays visible and wraps, no inner scroll. */}
                    <Textarea
                      value={item.text}
                      aria-label="Akzeptanzkriterium"
                      rows={1}
                      onChange={(event) =>
                        setCriteria((current) =>
                          renameAcceptanceCriterion(current, item.id, event.target.value),
                        )
                      }
                      className={cn(
                        "min-h-8 flex-1 resize-none py-1 leading-snug",
                        item.done && "text-muted line-through",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Kriterium entfernen"
                      onClick={() =>
                        setCriteria((current) =>
                          removeAcceptanceCriterion(current, item.id),
                        )
                      }
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="flex items-center gap-2">
            <Input
              id="ac-new"
              data-testid="ac-new-input"
              value={newCriterion}
              placeholder="Kriterium hinzufügen…"
              onChange={(event) => setNewCriterion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCriterion();
                }
              }}
              className="h-8 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCriterion}
              disabled={!newCriterion.trim()}
            >
              <Plus className="size-4" aria-hidden />
              Hinzufügen
            </Button>
          </div>
        </div>

        {/* Reuse the story→tasks decomposition (TASK-037) so the dialog is the
            single place to break a story down as well. */}
        <StoryTasks story={story} projectId={story.projectId} projectName={projectName} />

        <ActivityFeedPanel
          entityType="story"
          entityId={story.id}
          title="Verlauf"
          limit={8}
        />
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 aria-hidden />
          Löschen
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </DialogFooter>
    </>
  );
}

/**
 * The single, reusable story detail/edit dialog (TASK-058). Opens from the
 * backlog tree, sprint planning cards and the sprint detail page and edits a
 * story through the backlog store (title/description/epic/priority/PT + checkable
 * acceptance criteria), reuses `StoryTasks` for the dev-task breakdown and shows
 * the story's activity history. Mirrors the `TaskDialog` interaction pattern.
 */
export function StoryDialog({ story, onOpenChange }: StoryDialogProps) {
  return (
    <Dialog open={!!story} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {story && (
          <StoryForm
            key={story.id}
            story={story}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
