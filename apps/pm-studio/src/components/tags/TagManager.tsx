"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAG_COLORS, tagColorStyle } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useTagStore } from "@/store/useTagStore";
import type { TagColor } from "@/types";

/** Clickable swatches to pick one of the fixed palette colors. */
function ColorPicker({
  value,
  onChange,
  idPrefix,
}: {
  value: TagColor;
  onChange: (color: TagColor) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Farbe">
      {TAG_COLORS.map((color) => {
        const style = tagColorStyle(color);
        const selected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={style.label}
            title={style.label}
            data-testid={`${idPrefix}-color-${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow",
              style.swatch,
              selected && "ring-2 ring-ring",
            )}
          >
            {selected && <Check className="size-3.5 text-white" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Add-tag row: name + color, appends a new tag with a random id. */
function AddTagRow() {
  const addTag = useTagStore((state) => state.addTag);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>(TAG_COLORS[0]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addTag({ id: crypto.randomUUID(), name: trimmed, color });
    setName("");
    setColor(TAG_COLORS[0]);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <Label htmlFor="new-tag-name">Neuer Tag</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="new-tag-name"
          value={name}
          placeholder="z. B. Frontend"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="min-w-40 flex-1"
        />
        <ColorPicker value={color} onChange={setColor} idPrefix="new-tag" />
        <Button type="button" onClick={submit} disabled={!name.trim()}>
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}

type TagManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Central tag administration (TASK-031): create, rename, recolor and delete
 * tags. Deleting detaches the tag from all board items (useTagStore.removeTag).
 * Reads/writes the tag store directly so the board page stays lean.
 */
export function TagManager({ open, onOpenChange }: TagManagerProps) {
  const tags = useTagStore((state) => state.tags);
  const updateTag = useTagStore((state) => state.updateTag);
  const removeTag = useTagStore((state) => state.removeTag);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tags verwalten</DialogTitle>
          <DialogDescription>
            Tags anlegen, umbenennen, umfärben oder löschen. Gelöschte Tags
            werden von allen Items entfernt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          {tags.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
              Noch keine Tags. Lege unten den ersten an.
            </p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                data-testid={`tag-row-${tag.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2"
              >
                <Input
                  aria-label={`Name von ${tag.name}`}
                  value={tag.name}
                  onChange={(event) =>
                    updateTag(tag.id, { name: event.target.value })
                  }
                  className="min-w-36 flex-1"
                />
                <ColorPicker
                  value={tag.color}
                  onChange={(color) => updateTag(tag.id, { color })}
                  idPrefix={`tag-${tag.id}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${tag.name} löschen`}
                  onClick={() => removeTag(tag.id)}
                >
                  <Trash2 className="size-4 text-danger" aria-hidden />
                </Button>
              </div>
            ))
          )}
        </div>

        <AddTagRow />
      </DialogContent>
    </Dialog>
  );
}
