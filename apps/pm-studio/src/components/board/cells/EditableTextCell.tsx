"use client";

import { type KeyboardEvent, type ReactNode, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditableTextCellProps = {
  /** Current persisted value; `undefined`/`""` renders the empty label. */
  value: string | number | undefined;
  /**
   * Called with the raw input string on commit (Enter or blur). The caller
   * trims/parses/validates – this cell stays dumb so it works for text and
   * numbers alike.
   */
  onCommit: (raw: string) => void;
  type?: "text" | "number";
  ariaLabel: string;
  /** Rendered in display mode when the value is empty. */
  emptyLabel?: ReactNode;
  /** Class for the display-mode text (e.g. font/colour to match the column). */
  className?: string;
};

/**
 * One inline-editable text/number cell (TASK-030): a button shows the value and
 * turns into an input on click. Enter and blur commit, Esc cancels. Click
 * propagation is stopped so editing never opens the row's TaskDialog.
 */
export function EditableTextCell({
  value,
  onCommit,
  type = "text",
  ariaLabel,
  emptyLabel,
  className,
}: EditableTextCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const start = () => {
    setDraft(value === undefined ? "" : String(value));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    onCommit(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
        <Input
          type={type}
          min={type === "number" ? 0 : undefined}
          autoFocus
          aria-label={ariaLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          className="h-7 w-28 py-0.5 text-sm"
        />
      </span>
    );
  }

  const empty = value === undefined || value === "";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        start();
      }}
      className={cn(
        "-mx-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-surface-hover",
        className,
      )}
    >
      {empty ? (emptyLabel ?? <span className="text-muted">–</span>) : value}
    </button>
  );
}
