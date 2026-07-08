"use client";

import { type KeyboardEvent, useState } from "react";
import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AddColumnTileProps = {
  /**
   * Called with the trimmed, non-empty label when the user presses Enter. The
   * field stays open and clears for the next entry – fast capture without the
   * ColumnManager dialog (TASK-051). Empty labels are ignored. The store
   * (`useBoardColumnsStore.addColumn`) appends a non-terminal phase at the end.
   */
  onAdd: (label: string) => void;
};

/**
 * Inline "+ Spalte" tile right of the last Kanban column (TASK-051). A discreet
 * trigger opens a single text field; Enter creates the phase and keeps the field
 * open for the next one, Esc/blur closes. Mirrors the QuickAddTask pattern
 * (TASK-033) so column creation feels the same as task creation.
 */
export function AddColumnTile({ onAdd }: AddColumnTileProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

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

  return (
    <div className="flex w-48 shrink-0 flex-col rounded-xl border border-dashed border-border bg-surface/20 p-3">
      {editing ? (
        <Input
          autoFocus
          data-testid="add-column-input"
          aria-label="Neue Spalte hinzufügen"
          placeholder="Spaltenname … (Enter)"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setEditing(false)}
          className="h-8 text-sm"
        />
      ) : (
        <button
          type="button"
          data-testid="add-column-trigger"
          onClick={() => setEditing(true)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm",
            "text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground",
          )}
        >
          <Plus className="size-4 shrink-0" />
          Spalte
        </button>
      )}
    </div>
  );
}
