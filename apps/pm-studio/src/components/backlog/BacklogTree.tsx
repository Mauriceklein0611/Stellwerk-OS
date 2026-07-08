"use client";

import { type KeyboardEvent, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { EditableTextCell } from "@/components/board/cells/EditableTextCell";
import {
  EditableSelectCell,
  type SelectCellOption,
} from "@/components/board/cells/EditableSelectCell";
import { EpicHeader } from "@/components/backlog/EpicHeader";
import { ProvenanceBadge } from "@/components/backlog/ProvenanceBadge";
import { Input } from "@/components/ui/input";
import { severityBadge } from "@/lib/severity";
import { storiesForEpic } from "@/lib/backlog";
import { storyTaskRollup } from "@/lib/story-tasks";
import { cn } from "@/lib/utils";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import type {
  BoardColumnDef,
  BoardTask,
  Epic,
  Priority,
  Release,
  UserStory,
} from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Sentinel select value for "no release" (base-ui Select needs a string). */
const NO_RELEASE = "__none__";

const PRIORITY_OPTIONS: SelectCellOption[] = PRIORITIES.map((priority) => {
  const badge = severityBadge(priority);
  return {
    value: priority,
    label: badge.label,
    node: <StatusBadge status={badge.status} label={badge.label} />,
  };
});

export type BacklogTreeProps = {
  epics: Epic[];
  /** All stories of the active project (already filtered); grouped per epic. */
  stories: UserStory[];
  /** All board tasks – used for each story's task roll-up (TASK-037/038). */
  tasks: BoardTask[];
  /** Releases of the active project for the inline release cell (TASK-062). */
  releases: Release[];
  /** Custom board phases so "done" stays terminal-aware (TASK-032). */
  columns?: BoardColumnDef[];
  onRenameEpic: (id: string, title: string) => void;
  onDeleteEpic: (epic: Epic) => void;
  onAddStory: (epicId: string, title: string) => void;
  onUpdateStory: (
    id: string,
    patch: Partial<
      Pick<UserStory, "title" | "priority" | "estimate_pt" | "releaseId">
    >,
  ) => void;
  onDeleteStory: (story: UserStory) => void;
  /** Open the story detail dialog (TASK-058); triggered by a row click. */
  onOpenStory: (story: UserStory) => void;
  onReorderStory: (epicId: string, storyId: string, targetIndex: number) => void;
  /** Epic whose inline "+ Story" field is currently open (null = none). */
  openAddStoryEpicId: string | null;
  onOpenAddStory: (epicId: string | null) => void;
};

/**
 * The backlog tree (TASK-057): epics as always-open sections (lesson from
 * TASK-052) with their stories as inline-editable, drag-sortable rows. Reordering
 * is vertical and scoped to one epic (a story keeps its epic); the persisted rank
 * comes from `onReorderStory` → `reorderStory`.
 */
export function BacklogTree({
  epics,
  stories,
  tasks,
  releases,
  columns,
  onRenameEpic,
  onDeleteEpic,
  onAddStory,
  onUpdateStory,
  onDeleteStory,
  onOpenStory,
  onReorderStory,
  openAddStoryEpicId,
  onOpenAddStory,
}: BacklogTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // storyId → epicId so a drag can be resolved to the epic it happens in.
  const epicOfStory = new Map(stories.map((story) => [story.id, story.epicId]));

  // Release options for the inline cell: "Kein Release" + one per project release.
  const releaseOptions: SelectCellOption[] = [
    { value: NO_RELEASE, label: "–" },
    ...releases.map((release) => ({ value: release.id, label: release.name })),
  ];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const storyId = String(active.id);
    const overId = String(over.id);
    const epicId = epicOfStory.get(storyId);
    // Only reorder within the same epic (vertical, per-epic ranking).
    if (!epicId || epicOfStory.get(overId) !== epicId) return;

    const ordered = storiesForEpic(stories, epicId);
    const targetIndex = ordered.findIndex((story) => story.id === overId);
    if (targetIndex === -1) return;
    onReorderStory(epicId, storyId, targetIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Accordion
        multiple
        defaultValue={epics.map((epic) => epic.id)}
        className="flex flex-col gap-3"
      >
        {epics.map((epic) => {
          const epicStories = storiesForEpic(stories, epic.id);
          return (
            <AccordionItem
              key={epic.id}
              value={epic.id}
              className="rounded-xl border border-border px-3 not-last:border-b"
            >
              <EpicHeader
                epic={epic}
                stories={stories}
                onRename={(title) => onRenameEpic(epic.id, title)}
                onDelete={() => onDeleteEpic(epic)}
              />
              <AccordionContent>
                <div className="flex flex-col gap-2 pb-1">
                  <SortableContext
                    items={epicStories.map((story) => story.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {epicStories.map((story) => (
                      <StoryRow
                        key={story.id}
                        story={story}
                        rollup={storyTaskRollup(story.id, tasks, columns)}
                        releaseOptions={releaseOptions}
                        onUpdate={(patch) => onUpdateStory(story.id, patch)}
                        onDelete={() => onDeleteStory(story)}
                        onOpen={() => onOpenStory(story)}
                      />
                    ))}
                  </SortableContext>

                  {epicStories.length === 0 && (
                    <p className="px-1 py-2 text-sm text-muted">
                      Noch keine Stories in diesem Epic.
                    </p>
                  )}

                  <InlineAdd
                    open={openAddStoryEpicId === epic.id}
                    onOpenChange={(open) =>
                      onOpenAddStory(open ? epic.id : null)
                    }
                    onSubmit={(title) => onAddStory(epic.id, title)}
                    triggerLabel="Story hinzufügen"
                    placeholder="Story-Titel … (Enter)"
                    testId={`backlog-add-story-${epic.id}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </DndContext>
  );
}

type StoryRowProps = {
  story: UserStory;
  rollup: ReturnType<typeof storyTaskRollup>;
  /** "Kein Release" + one option per project release (TASK-062). */
  releaseOptions: SelectCellOption[];
  onUpdate: (
    patch: Partial<
      Pick<UserStory, "title" | "priority" | "estimate_pt" | "releaseId">
    >,
  ) => void;
  onDelete: () => void;
  onOpen: () => void;
};

/**
 * A single, drag-sortable story row with inline-editable title/priority/PT. A
 * click on the row (anywhere the inline cells / grip / delete don't intercept)
 * opens the story dialog (TASK-058); the inline cells stop propagation so
 * editing them never opens the dialog.
 */
function StoryRow({
  story,
  rollup,
  releaseOptions,
  onUpdate,
  onDelete,
  onOpen,
}: StoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: story.id });
  const itemKey = useItemKeyStore((state) => state.keys[story.id]);

  return (
    <div
      ref={setNodeRef}
      data-testid={`backlog-story-${story.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 transition-colors hover:border-foreground/30",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        aria-label={`Story „${story.title}“ verschieben`}
        data-testid={`backlog-drag-${story.id}`}
        className="flex-none cursor-grab touch-none rounded p-1 text-muted hover:text-foreground active:cursor-grabbing"
        onClick={(event) => event.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {itemKey && (
        <span
          data-testid={`backlog-key-${story.id}`}
          className="hidden shrink-0 font-mono text-xs text-muted sm:inline"
        >
          {itemKey}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <EditableTextCell
          value={story.title}
          ariaLabel={`Story-Titel: ${story.title}`}
          onCommit={(raw) => {
            const trimmed = raw.trim();
            if (trimmed) onUpdate({ title: trimmed });
          }}
          className="w-full truncate text-sm font-medium text-foreground"
        />
      </div>

      {/* Provenance mark (TASK-060): agent / bearbeitet; nothing for manual. */}
      <ProvenanceBadge provenance={story.provenance} className="shrink-0" />

      <EditableSelectCell
        value={story.priority}
        options={PRIORITY_OPTIONS}
        ariaLabel={`Priorität: ${story.priority}`}
        onChange={(value) => onUpdate({ priority: value as Priority })}
      />

      <EditableTextCell
        value={story.estimate_pt}
        type="number"
        ariaLabel={`Story Points: ${story.estimate_pt}`}
        onCommit={(raw) => {
          const parsed = Number(raw.trim());
          if (Number.isFinite(parsed) && parsed >= 0) {
            onUpdate({ estimate_pt: parsed });
          }
        }}
        className="w-12 text-right font-mono text-xs text-muted"
      />
      <span className="w-6 shrink-0 text-right font-mono text-xs text-muted">
        PT
      </span>

      {/* Dev-task roll-up (TASK-037): done/total tasks. */}
      <span
        data-testid={`backlog-rollup-${story.id}`}
        className="w-14 shrink-0 text-right font-mono text-xs text-muted"
      >
        {rollup.doneTasks}/{rollup.total}
      </span>

      {/* Release scope (TASK-062): assign inline; only real releases are options. */}
      <div className="hidden w-28 shrink-0 justify-end text-right text-xs text-muted sm:flex">
        <EditableSelectCell
          value={story.releaseId ?? NO_RELEASE}
          options={releaseOptions}
          ariaLabel={`Release: ${story.title}`}
          disabled={releaseOptions.length <= 1}
          onChange={(value) =>
            onUpdate({ releaseId: value === NO_RELEASE ? undefined : value })
          }
        />
      </div>

      <button
        type="button"
        aria-label={`Story „${story.title}“ löschen`}
        data-testid={`backlog-story-delete-${story.id}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="flex-none rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

type InlineAddProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the trimmed, non-empty value; the field stays open to add more. */
  onSubmit: (value: string) => void;
  triggerLabel: string;
  placeholder?: string;
  /** Base for test ids: `${testId}-trigger` and `${testId}-input`. */
  testId: string;
};

/**
 * Controlled inline add (TASK-057), reused for "+ Epic" and "+ Story". The open
 * state is lifted so the CommandBar "Neue Story" intent can pre-open the right
 * epic's field (TASK-042 pattern). Enter submits and keeps the field open; Esc
 * or blur closes it.
 */
export function InlineAdd({
  open,
  onOpenChange,
  onSubmit,
  triggerLabel,
  placeholder,
  testId,
}: InlineAddProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setDraft(""); // keep open for the next entry
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      onOpenChange(false);
    }
  };

  if (open) {
    return (
      <Input
        autoFocus
        data-testid={`${testId}-input`}
        aria-label={triggerLabel}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onOpenChange(false)}
        className="h-8 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      data-testid={`${testId}-trigger`}
      onClick={() => onOpenChange(true)}
      className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <Plus className="size-3.5 shrink-0" />
      {triggerLabel}
    </button>
  );
}
