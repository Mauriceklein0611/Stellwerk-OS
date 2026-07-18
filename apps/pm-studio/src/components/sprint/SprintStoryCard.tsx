"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { severityBadge } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import type { UserStory } from "@/types";

type SprintStoryCardProps = {
  story: UserStory;
  /** True when all of the story's board tasks are terminal (TASK-038). */
  done?: boolean;
  /** Open the story dialog (TASK-058); a click anywhere but the grip triggers it. */
  onOpen?: (story: UserStory) => void;
  /**
   * Layout variant. `card` is the stacked block used by the old column layout;
   * `row` is the compact one-line variant for the vertical sprint sections
   * (TASK-059). Both keep the grip-handle-vs-click behaviour from TASK-058.
   */
  variant?: "card" | "row";
};

/**
 * A user story on the sprint planning board (TASK-017). Since TASK-058 the drag
 * is on an explicit grip handle so a click on the card body opens the story
 * dialog instead of starting a drag. Keyboard D&D stays intact (the grip carries
 * the sortable listeners/attributes, so it is the keyboard activator).
 */
export function SprintStoryCard({
  story,
  done,
  onOpen,
  variant = "card",
}: SprintStoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: story.id });
  const itemKey = useItemKeyStore((state) => state.keys[story.id]);

  const priority = severityBadge(story.priority);

  const grip = (
    <button
      type="button"
      aria-label={`Story „${story.title}" verschieben`}
      data-testid={`sprint-story-drag-${story.id}`}
      onClick={(event) => event.stopPropagation()}
      className="flex-none cursor-grab touch-none rounded p-0.5 text-muted hover:text-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  if (variant === "row") {
    return (
      <div
        ref={setNodeRef}
        data-testid={`sprint-story-${story.id}`}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        onClick={onOpen ? () => onOpen(story) : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-left shadow-sm transition-colors hover:border-foreground/30",
          onOpen && "cursor-pointer",
          isDragging && "opacity-50",
        )}
      >
        {grip}
        {itemKey && (
          <span className="shrink-0 font-mono text-xs text-muted">{itemKey}</span>
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {story.title}
        </p>
        {done && <StatusBadge status="success" label="Fertig" />}
        <StatusBadge status={priority.status} label={priority.label} />
        <span className="shrink-0 font-mono text-xs text-muted">
          {story.estimate_pt} PT
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`sprint-story-${story.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen ? () => onOpen(story) : undefined}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition-colors hover:border-foreground/30",
        onOpen && "cursor-pointer",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <span className="-ml-1 mt-0.5">{grip}</span>
          <p className="text-sm font-medium text-foreground">
            {itemKey && (
              <span className="mr-1.5 font-mono text-xs text-muted">{itemKey}</span>
            )}
            {story.title}
          </p>
        </div>
        {done && <StatusBadge status="success" label="Fertig" />}
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={priority.status} label={priority.label} />
        <span className="font-mono text-xs text-muted">{story.estimate_pt} PT</span>
      </div>
    </div>
  );
}
