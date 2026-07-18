"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RETRO_COLUMNS,
  type RetroColumnKey,
  retroFromLists,
  retroListsFromRetro,
} from "@/lib/sprint-review-schema";
import type { RetroContent, SprintRetro } from "@/types";

type RetroFormProps = {
  sprintId: string;
  /** Existing retro to prefill; undefined → empty lists. */
  retro?: SprintRetro;
  /** Called with the retro content on save; the caller adds ceremony metadata. */
  onSave: (content: RetroContent) => void;
};

/** Sprint-retro form: three editable item lists, add/remove per column (TASK-018). */
export function RetroForm({ sprintId, retro, onSave }: RetroFormProps) {
  const [lists, setLists] = useState<Record<RetroColumnKey, string[]>>(() =>
    retroListsFromRetro(retro),
  );
  const [drafts, setDrafts] = useState<Record<RetroColumnKey, string>>({
    good: "",
    improve: "",
    actions: "",
  });
  const [saved, setSaved] = useState(false);

  function addItem(key: RetroColumnKey) {
    const value = drafts[key].trim();
    if (!value) return;
    setLists((current) => ({ ...current, [key]: [...current[key], value] }));
    setDrafts((current) => ({ ...current, [key]: "" }));
    setSaved(false);
  }

  function removeItem(key: RetroColumnKey, index: number) {
    setLists((current) => ({
      ...current,
      [key]: current[key].filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  function handleSave() {
    onSave(retroFromLists(sprintId, lists));
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RETRO_COLUMNS.map((column) => (
          <div key={column.key} className="flex flex-col gap-2">
            <Label>{column.label}</Label>
            <ul className="flex flex-col gap-1.5">
              {lists[column.key].map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface/50 px-2 py-1 text-sm"
                >
                  <span className="break-words">{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${column.label}: „${item}" entfernen`}
                    onClick={() => removeItem(column.key, index)}
                  >
                    <X />
                  </Button>
                </li>
              ))}
              {lists[column.key].length === 0 && (
                <li className="rounded-md border border-dashed border-border px-2 py-1 text-center text-xs text-muted">
                  Noch keine Einträge
                </li>
              )}
            </ul>
            <div className="flex items-center gap-1.5">
              <Input
                value={drafts[column.key]}
                aria-label={`${column.label}: neuer Eintrag`}
                placeholder="Eintrag …"
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [column.key]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addItem(column.key);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`${column.label}: hinzufügen`}
                onClick={() => addItem(column.key)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
        {saved && (
          <span className="text-xs text-success" role="status">
            Retro gespeichert.
          </span>
        )}
        <Button type="button" onClick={handleSave}>
          Retro speichern
        </Button>
      </div>
    </div>
  );
}
