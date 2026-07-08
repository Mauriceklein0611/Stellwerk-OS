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
import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
import { DecisionLogPanel } from "@/components/activity/DecisionLogPanel";
import {
  RELEASE_STATUS,
  RELEASE_STATUS_ORDER,
  SPRINT_LENGTH_LABEL,
  SPRINT_LENGTH_OPTIONS,
} from "@/lib/release-meta";
import type { Release, ReleaseStatus, SprintLengthWeeks } from "@/types";

export type ReleaseFormValues = {
  name: string;
  projectId: string;
  status: ReleaseStatus;
  /** ISO date (`YYYY-MM-DD`). */
  startDate: string;
  endDate: string;
  sprintLengthWeeks: SprintLengthWeeks;
};

type ReleaseDialogProps = {
  open: boolean;
  /** null → create mode, otherwise edit mode. */
  release: Release | null;
  projects: { id: string; name: string }[];
  /** Pre-selected project in create mode (the page's active project). */
  defaultProjectId?: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ReleaseFormValues) => void;
  onUpdate: (id: string, patch: Partial<ReleaseFormValues>) => void;
  onDelete: (id: string) => void;
};

type ReleaseFormProps = Omit<ReleaseDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

/**
 * Form for one release. Keyed by release id (or "new") in the parent so it
 * remounts and re-initializes its state whenever a different release opens.
 */
function ReleaseForm({
  release,
  projects,
  defaultProjectId,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: ReleaseFormProps) {
  const isEdit = release !== null;
  const [name, setName] = useState(release?.name ?? "");
  const [projectId, setProjectId] = useState(
    release?.projectId ?? defaultProjectId ?? "",
  );
  const [status, setStatus] = useState<ReleaseStatus>(
    release?.status ?? "planned",
  );
  const [startDate, setStartDate] = useState(release?.startDate ?? "");
  const [endDate, setEndDate] = useState(release?.endDate ?? "");
  const [sprintLengthWeeks, setSprintLengthWeeks] = useState<SprintLengthWeeks>(
    release?.sprintLengthWeeks ?? 2,
  );

  // ISO dates compare lexicographically, so a string compare is enough here.
  const rangeInvalid =
    startDate !== "" && endDate !== "" && endDate < startDate;
  const canSave =
    name.trim().length > 0 &&
    projectId !== "" &&
    startDate !== "" &&
    endDate !== "" &&
    !rangeInvalid;

  function handleSave() {
    const values: ReleaseFormValues = {
      name: name.trim(),
      projectId,
      status,
      startDate,
      endDate,
      sprintLengthWeeks,
    };
    if (isEdit) onUpdate(release.id, values);
    else onCreate(values);
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Release bearbeiten" : "Neues Release"}
        </DialogTitle>
        <DialogDescription>
          Name, Projekt, Zeitraum und Sprint-Dauer festlegen – die Sprints werden
          daraus automatisch erzeugt.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="release-name">Name</Label>
          <Input
            id="release-name"
            value={name}
            placeholder="z. B. Release Q3"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="release-project">Projekt</Label>
          <Select
            value={projectId}
            onValueChange={(value) => setProjectId(value ?? "")}
            disabled={isEdit}
          >
            <SelectTrigger id="release-project" className="w-full">
              <SelectValue>
                {(value) =>
                  projects.find((project) => project.id === value)?.name ??
                  "Projekt wählen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus((value as ReleaseStatus | null) ?? "planned")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) => RELEASE_STATUS[value as ReleaseStatus].label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RELEASE_STATUS_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {RELEASE_STATUS[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="release-start">Start</Label>
              <Input
                id="release-start"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="release-end">Ende</Label>
              <Input
                id="release-end"
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
          <Label>Sprint-Dauer</Label>
          <Select
            value={String(sprintLengthWeeks)}
            onValueChange={(value) =>
              setSprintLengthWeeks(Number(value) as SprintLengthWeeks)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value) =>
                  SPRINT_LENGTH_LABEL[Number(value) as SprintLengthWeeks]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SPRINT_LENGTH_OPTIONS.map((weeks) => (
                <SelectItem key={weeks} value={String(weeks)}>
                  {SPRINT_LENGTH_LABEL[weeks]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-4 pb-4">
          <ActivityFeedPanel entityType="release" entityId={release.id} limit={8} />
          <DecisionLogPanel entityType="release" entityId={release.id} />
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {isEdit ? (
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(release.id);
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

/** Create/edit dialog for a release (TASK-025). */
export function ReleaseDialog({
  open,
  onOpenChange,
  ...rest
}: ReleaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ReleaseForm
            key={rest.release?.id ?? "new"}
            onClose={() => onOpenChange(false)}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
