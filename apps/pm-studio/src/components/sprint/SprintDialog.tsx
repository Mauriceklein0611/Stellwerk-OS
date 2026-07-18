"use client";

import { useState } from "react";

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
import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
import { DecisionLogPanel } from "@/components/activity/DecisionLogPanel";
import { SPRINT_STATUS, SPRINT_STATUS_ORDER } from "@/lib/sprint";
import type { PlannedSprint, SprintStatus } from "@/types";

type SprintFormValues = {
  name: string;
  goal: string;
  status: SprintStatus;
  /** ISO date (`YYYY-MM-DD`) or undefined when no timebox is set. */
  startDate?: string;
  endDate?: string;
};

type SprintDialogProps = {
  open: boolean;
  /** null → create mode, otherwise edit mode. */
  sprint: PlannedSprint | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: SprintFormValues) => void;
  onUpdate: (id: string, patch: Partial<SprintFormValues>) => void;
  onDelete: (id: string) => void;
};

type SprintFormProps = {
  sprint: PlannedSprint | null;
  onCreate: (values: SprintFormValues) => void;
  onUpdate: (id: string, patch: Partial<SprintFormValues>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

/**
 * Form for one sprint. Keyed by sprint id (or "new") in the parent so it
 * remounts and re-initializes its state whenever a different sprint is opened.
 */
function SprintForm({ sprint, onCreate, onUpdate, onDelete, onClose }: SprintFormProps) {
  const [name, setName] = useState(sprint?.name ?? "");
  const [goal, setGoal] = useState(sprint?.goal ?? "");
  const [status, setStatus] = useState<SprintStatus>(sprint?.status ?? "planned");
  const [startDate, setStartDate] = useState(sprint?.startDate ?? "");
  const [endDate, setEndDate] = useState(sprint?.endDate ?? "");

  const isEdit = sprint !== null;
  // ISO dates compare lexicographically, so a string compare is enough here.
  const rangeInvalid =
    startDate !== "" && endDate !== "" && endDate < startDate;
  const canSave = name.trim().length > 0 && !rangeInvalid;

  function handleSave() {
    const values: SprintFormValues = {
      name: name.trim(),
      goal: goal.trim(),
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    if (isEdit) onUpdate(sprint.id, values);
    else onCreate(values);
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Sprint bearbeiten" : "Neuer Sprint"}</DialogTitle>
        <DialogDescription>
          Name, Ziel, Zeitraum und Status des Sprints festlegen.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sprint-name">Name</Label>
          <Input
            id="sprint-name"
            value={name}
            placeholder="z. B. Sprint 1"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sprint-goal">Ziel</Label>
          <Textarea
            id="sprint-goal"
            rows={2}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sprint-start">Start</Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sprint-end">Ende</Label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          {rangeInvalid && (
            <p className="text-xs text-danger">
              Das Enddatum muss am oder nach dem Startdatum liegen.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as SprintStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) => SPRINT_STATUS[value as SprintStatus].label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SPRINT_STATUS_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {SPRINT_STATUS[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="mt-4 flex flex-col gap-4">
          <ActivityFeedPanel entityType="sprint" entityId={sprint.id} limit={8} />
          <DecisionLogPanel entityType="sprint" entityId={sprint.id} />
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {isEdit ? (
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(sprint.id);
              onClose();
            }}
          >
            Löschen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** Create/edit dialog for a sprint (TASK-017). */
export function SprintDialog({
  open,
  sprint,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
}: SprintDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <SprintForm
            key={sprint?.id ?? "new"}
            sprint={sprint}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
