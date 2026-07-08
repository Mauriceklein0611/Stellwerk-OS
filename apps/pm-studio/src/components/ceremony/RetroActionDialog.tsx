"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Person } from "@/types";

/** Sentinel for "no assignee" – base-ui Select needs a non-empty string value. */
const UNASSIGNED = "__unassigned__";

/** Values the dialog hands back on confirm (TASK-065). */
export type RetroActionTaskValues = {
  title: string;
  assigneeId?: string;
  dueDate?: string;
};

type RetroActionDialogProps = {
  /** The retro action to turn into a task; null while closed. */
  action: string | null;
  /** Project the sprint (and thus the task) belongs to – shown for context. */
  projectName: string;
  persons: Person[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: RetroActionTaskValues) => void;
};

/**
 * Pre-filled mini dialog to turn a retro action into a board task (TASK-065):
 * title (defaults to the action text), optional assignee and due date. Kept
 * deliberately small – project/column are derived by the caller from the sprint.
 * The inner form is keyed by `action` so each open initializes fresh from props
 * (no setState-in-effect, mirrors CeremonyDialog).
 */
export function RetroActionDialog({
  action,
  projectName,
  persons,
  onOpenChange,
  onCreate,
}: RetroActionDialogProps) {
  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {action !== null && (
          <RetroActionForm
            key={action}
            action={action}
            projectName={projectName}
            persons={persons}
            onCreate={(values) => {
              onCreate(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type RetroActionFormProps = {
  action: string;
  projectName: string;
  persons: Person[];
  onCreate: (values: RetroActionTaskValues) => void;
  onCancel: () => void;
};

function RetroActionForm({
  action,
  projectName,
  persons,
  onCreate,
  onCancel,
}: RetroActionFormProps) {
  const [title, setTitle] = useState(action);
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const [dueDate, setDueDate] = useState("");

  const trimmed = title.trim();

  function handleCreate() {
    if (!trimmed) return;
    onCreate({
      title: trimmed,
      assigneeId: assigneeId === UNASSIGNED ? undefined : assigneeId,
      dueDate: dueDate || undefined,
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Maßnahme als Task</DialogTitle>
        <DialogDescription>
          Erzeugt einen Board-Task in „{projectName}“ (Spalte „To Do“). Die
          Maßnahme bleibt mit dem Task verknüpft.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="retro-action-title">Titel</Label>
          <Input
            id="retro-action-title"
            data-testid="retro-action-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreate();
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Zuständig</Label>
            <Select
              value={assigneeId}
              onValueChange={(value) => setAssigneeId(value ?? UNASSIGNED)}
            >
              <SelectTrigger
                className="w-full"
                data-testid="retro-action-assignee-trigger"
              >
                <SelectValue>
                  {(value) =>
                    value === UNASSIGNED
                      ? "Niemand"
                      : persons.find((p) => p.id === value)?.name ?? "Niemand"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Niemand</SelectItem>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="retro-action-due">Fällig am</Label>
            <Input
              id="retro-action-due"
              type="date"
              data-testid="retro-action-due"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          data-testid="retro-action-create"
          disabled={!trimmed}
          onClick={handleCreate}
        >
          Task erstellen
        </Button>
      </DialogFooter>
    </>
  );
}
