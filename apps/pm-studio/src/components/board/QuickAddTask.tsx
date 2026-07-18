"use client";

import { type KeyboardEvent, useState } from "react";
import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type QuickAddTaskProps = {
  /**
   * Called with the trimmed, non-empty title when the user presses Enter. The
   * field stays open and clears for the next entry – fast capture without the
   * full TaskDialog (TASK-033). Empty titles are ignored.
   */
  onAdd: (title: string) => void;
  /**
   * Disable quick-add (e.g. no single project selected): shows `disabledHint`
   * instead of the trigger, because a board task always needs a project.
   */
  disabled?: boolean;
  /** Hint rendered in the disabled state. */
  disabledHint?: string;
  /** Column id, used for aria-label and test ids. */
  columnId: string;
  /** Column label for an explicit aria-label. */
  columnLabel: string;
};

/**
 * Inline "+ Task" at the foot of a Kanban column (TASK-033). A discreet trigger
 * opens a single text field; Enter creates the task and keeps the field open for
 * the next one, Esc/blur closes. Reuses the inline-edit pattern from TASK-030.
 */
export function QuickAddTask({
  onAdd,
  disabled,
  disabledHint,
  columnId,
  columnLabel,
}: QuickAddTaskProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (disabled) {
    return (
      <p
        data-testid={`quick-add-disabled-${columnId}`}
        className="px-2 py-1.5 text-center text-xs text-muted"
      >
        {disabledHint}
      </p>
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft(""); // keep the field open for the next entry
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        autoFocus
        data-testid={`quick-add-input-${columnId}`}
        aria-label={`Neuen Task in Spalte ${columnLabel} hinzufügen`}
        placeholder="Titel … (Enter)"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setEditing(false)}
        className="h-8 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      data-testid={`quick-add-trigger-${columnId}`}
      onClick={() => setEditing(true)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs",
        "text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground",
      )}
    >
      <Plus className="size-3.5 shrink-0" />
      Task hinzufügen
    </button>
  );
}
