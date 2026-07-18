"use client";

import { useState } from "react";
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";

import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
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
import {
  addChecklistItem,
  checklistComplete,
  checklistProgress,
  normalizeChecklist,
  removeChecklistItem,
  renameChecklistItem,
  toggleChecklistItem,
} from "@/lib/checklist";
import { severityBadge } from "@/lib/severity";
import { tagColorStyle } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useTagStore } from "@/store/useTagStore";
import type { BoardColumn, BoardTask, ChecklistItem, Priority } from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Select sentinel for "not assigned" (Select items can't hold ""). */
const UNASSIGNED = "unassigned";

type TaskDialogProps = {
  task: BoardTask | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<Omit<BoardTask, "id">>) => void;
  /** Delete this task (TASK-040): runs the shared confirm + toast/undo flow. */
  onDelete: (id: string) => void;
};

type TaskFormProps = {
  task: BoardTask;
  onSave: (id: string, patch: Partial<Omit<BoardTask, "id">>) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
};

/**
 * Form fields for one task. Keyed by task.id in the parent so it remounts
 * (and re-initializes its local state) whenever a different task is opened.
 */
function TaskForm({ task, onSave, onDelete, onCancel }: TaskFormProps) {
  const persons = usePeopleStore((state) => state.persons);
  const tags = useTagStore((state) => state.tags);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const itemKey = useItemKeyStore((state) => state.keys[task.id]);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [column, setColumn] = useState<BoardColumn>(task.column);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? UNASSIGNED);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [tagIds, setTagIds] = useState<string[]>(task.tagIds ?? []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task.checklist ?? [],
  );
  const [newItem, setNewItem] = useState("");

  const toggleTag = (id: string) =>
    setTagIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );

  const addItem = () => {
    const next = addChecklistItem(checklist, newItem);
    if (next !== checklist) setNewItem("");
    setChecklist(next);
  };

  const progress = checklistProgress(checklist);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Task bearbeiten</DialogTitle>
        <DialogDescription>
          {itemKey && <span className="font-mono">{itemKey}</span>}
          {itemKey && " · "}
          {task.projectName}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-title">Titel</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-description">Beschreibung</Label>
          <Textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Spalte</Label>
            <Select value={column} onValueChange={(value) => setColumn(value as BoardColumn)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => boardColumns.find((c) => c.id === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {boardColumns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Zugewiesen an</Label>
          <Select
            value={assigneeId}
            onValueChange={(value) => setAssigneeId(value ?? UNASSIGNED)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) =>
                  persons.find((person) => person.id === value)?.name ??
                  "Nicht zugewiesen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Nicht zugewiesen</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-due">Fällig am</Label>
          <Input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="checklist-new">Checkliste</Label>
            {progress.total > 0 && (
              <span
                data-testid="checklist-dialog-progress"
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
                status={checklistComplete(checklist) ? "success" : "info"}
                label={`Checkliste: ${progress.done} von ${progress.total} erledigt`}
              />
              <ul className="flex flex-col gap-1.5">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    data-testid={`checklist-item-${item.id}`}
                    className="flex items-start gap-2"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={item.done}
                      aria-label={`„${item.text}“ als erledigt markieren`}
                      onClick={() =>
                        setChecklist((current) =>
                          toggleChecklistItem(current, item.id),
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
                    {/* Auto-growing field (field-sizing-content): the full item
                        text stays visible and wraps, no inner scroll. */}
                    <Textarea
                      value={item.text}
                      aria-label="Checklistenpunkt"
                      rows={1}
                      onChange={(event) =>
                        setChecklist((current) =>
                          renameChecklistItem(current, item.id, event.target.value),
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
                      aria-label="Punkt entfernen"
                      onClick={() =>
                        setChecklist((current) =>
                          removeChecklistItem(current, item.id),
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
              id="checklist-new"
              data-testid="checklist-new-input"
              value={newItem}
              placeholder="Punkt hinzufügen…"
              onChange={(event) => setNewItem(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addItem();
                }
              }}
              className="h-8 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={!newItem.trim()}
            >
              <Plus className="size-4" aria-hidden />
              Hinzufügen
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          {tags.length === 0 ? (
            <p className="text-xs text-muted">
              Noch keine Tags angelegt – über „Tags verwalten“ auf dem Board.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selected = tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity",
                      tagColorStyle(tag.color).chip,
                      !selected && "opacity-40 hover:opacity-70",
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ActivityFeedPanel
          entityType="task"
          entityId={task.id}
          title="Verlauf"
          limit={8}
        />
      </div>

      <DialogFooter className="sm:justify-between">
        <Button
          variant="destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 aria-hidden />
          Löschen
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          onClick={() =>
            onSave(task.id, {
              title,
              description,
              column,
              priority,
              assigneeId: assigneeId === UNASSIGNED ? undefined : assigneeId,
              dueDate: dueDate || undefined,
              tagIds: tagIds.length ? tagIds : undefined,
              checklist: normalizeChecklist(checklist),
            })
          }
        >
          Speichern
        </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** View/edit dialog for a board task: title, description, column, priority (TASK-008). */
export function TaskDialog({ task, onOpenChange, onSave, onDelete }: TaskDialogProps) {
  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {task && (
          <TaskForm
            key={task.id}
            task={task}
            onSave={(id, patch) => {
              onSave(id, patch);
              onOpenChange(false);
            }}
            onDelete={(id) => {
              onDelete(id);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
