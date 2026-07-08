"use client";

import { Trash2 } from "lucide-react";

import { AccordionTrigger } from "@/components/ui/accordion";
import { EditableTextCell } from "@/components/board/cells/EditableTextCell";
import { epicRollup } from "@/lib/backlog";
import type { Epic, UserStory } from "@/types";

type EpicHeaderProps = {
  epic: Epic;
  /** All project stories – the epic's own stories are derived for the roll-up. */
  stories: UserStory[];
  onRename: (title: string) => void;
  onDelete: () => void;
};

/**
 * One epic section header (TASK-057): a compact collapse toggle, the inline-
 * editable epic title, a story/points roll-up and a delete action. The toggle
 * (AccordionTrigger) is kept as its own small button so the editable title and
 * delete button are *siblings*, never nested inside another button.
 */
export function EpicHeader({ epic, stories, onRename, onDelete }: EpicHeaderProps) {
  const { storyCount, totalPt } = epicRollup(epic.id, stories);

  return (
    <div className="flex items-center gap-2 py-1">
      <AccordionTrigger
        aria-label={`Epic „${epic.title}“ ein-/ausklappen`}
        className="w-9 flex-none border-0 py-1"
      />
      <EditableTextCell
        value={epic.title}
        ariaLabel={`Epic-Titel: ${epic.title}`}
        onCommit={(raw) => {
          const trimmed = raw.trim();
          if (trimmed) onRename(trimmed);
        }}
        className="font-medium text-foreground"
      />
      <span className="font-mono text-xs text-muted">
        {storyCount} {storyCount === 1 ? "Story" : "Stories"} · {totalPt} PT
      </span>
      <button
        type="button"
        aria-label={`Epic „${epic.title}“ löschen`}
        data-testid={`epic-delete-${epic.id}`}
        onClick={onDelete}
        className="ml-auto rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
