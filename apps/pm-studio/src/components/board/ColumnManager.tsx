"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useBoardStore } from "@/store/useBoardStore";
import type { StatusType } from "@/types";

/** Status accents offered for a phase, with board-friendly German labels. */
const STATUS_OPTIONS: { value: StatusType; label: string }[] = [
  { value: "idle", label: "Neutral" },
  { value: "running", label: "Aktiv" },
  { value: "info", label: "Info" },
  { value: "success", label: "Erledigt" },
  { value: "warning", label: "Warnung" },
  { value: "danger", label: "Kritisch" },
];

const statusLabel = (status: StatusType): string =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

/** Status dropdown reused for add + edit; renders a StatusBadge per option. */
function StatusSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: StatusType;
  onChange: (status: StatusType) => void;
  ariaLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next as StatusType)}>
      <SelectTrigger className="h-9 w-36" aria-label={ariaLabel}>
        <SelectValue>
          {(current) => (
            <StatusBadge status={current as StatusType} label={statusLabel(current as StatusType)} />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <StatusBadge status={option.value} label={option.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Add-phase row: label + status accent, appends a new phase with a random id. */
function AddColumnRow() {
  const addColumn = useBoardColumnsStore((state) => state.addColumn);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    addColumn({ label: trimmed, status });
    setLabel("");
    setStatus("idle");
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <Label htmlFor="new-column-label">Neue Phase</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="new-column-label"
          value={label}
          placeholder="z. B. QA"
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="min-w-40 flex-1"
        />
        <StatusSelect value={status} onChange={setStatus} ariaLabel="Status der neuen Phase" />
        <Button type="button" onClick={submit} disabled={!label.trim()}>
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}

type ColumnManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Central board-phase administration (TASK-032): create, rename, recolor, set a
 * WIP limit, mark terminal (≙ done), reorder (move up/down) and delete phases.
 * Deleting moves the phase's tasks to the first remaining phase
 * (useBoardColumnsStore.removeColumn → useBoardStore.reassignColumn) so no task
 * dangles. The last phase and the last terminal phase are protected.
 */
export function ColumnManager({ open, onOpenChange }: ColumnManagerProps) {
  const columns = useBoardColumnsStore((state) => state.columns);
  const renameColumn = useBoardColumnsStore((state) => state.renameColumn);
  const setColumnStatus = useBoardColumnsStore((state) => state.setColumnStatus);
  const setColumnWip = useBoardColumnsStore((state) => state.setColumnWip);
  const setColumnTerminal = useBoardColumnsStore((state) => state.setColumnTerminal);
  const reorderColumns = useBoardColumnsStore((state) => state.reorderColumns);
  const removeColumn = useBoardColumnsStore((state) => state.removeColumn);
  const restoreColumns = useBoardColumnsStore((state) => state.restore);
  const restoreTasks = useBoardStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();

  const terminalCount = columns.filter((column) => column.isTerminal).length;

  /** Safe delete: confirm, relocate the phase's tasks, offer a 1:1 Undo. */
  function handleRemove(id: string, label: string, fallbackId: string) {
    const columnsBefore = useBoardColumnsStore.getState().columns;
    const tasksBefore = useBoardStore.getState().tasks;
    void confirmDelete({
      confirm: {
        title: `Phase „${label}“ löschen?`,
        description:
          "Die Phase wird gelöscht; ihre Tasks wandern in die erste verbliebene Phase.",
      },
      toastMessage: `Phase „${label}“ gelöscht.`,
      perform: () => removeColumn(id, fallbackId),
      undo: () => {
        restoreColumns(columnsBefore);
        restoreTasks(tasksBefore);
      },
    });
  }

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const ids = columns.map((column) => column.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderColumns(ids);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Spalten verwalten</DialogTitle>
          <DialogDescription>
            Board-Phasen anlegen, umbenennen, umfärben, WIP-Limit setzen, als
            „abgeschlossen“ markieren, sortieren oder löschen. Beim Löschen wandern
            die Tasks in die erste verbliebene Phase.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto py-2">
          {columns.map((column, index) => {
            const lastTerminal = column.isTerminal && terminalCount <= 1;
            const onlyColumn = columns.length <= 1;
            return (
              <div
                key={column.id}
                data-testid={`column-row-${column.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2"
              >
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${column.label} nach oben`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${column.label} nach unten`}
                    disabled={index === columns.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </Button>
                </div>

                <Input
                  aria-label={`Name von ${column.label}`}
                  value={column.label}
                  onChange={(event) => renameColumn(column.id, event.target.value)}
                  className="min-w-32 flex-1"
                />

                <StatusSelect
                  value={column.status}
                  onChange={(status) => setColumnStatus(column.id, status)}
                  ariaLabel={`Status von ${column.label}`}
                />

                <Input
                  type="number"
                  min="0"
                  aria-label={`WIP-Limit von ${column.label}`}
                  placeholder="WIP"
                  value={column.wipLimit ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    const value = Number(raw);
                    setColumnWip(
                      column.id,
                      raw === "" || !Number.isFinite(value) || value < 0
                        ? undefined
                        : value,
                    );
                  }}
                  className="w-20"
                />

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={column.isTerminal}
                  aria-label={`${column.label} als abgeschlossen markieren`}
                  disabled={lastTerminal}
                  onClick={() => setColumnTerminal(column.id, !column.isTerminal)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    column.isTerminal
                      ? "bg-success/10 text-success"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                    lastTerminal && "cursor-not-allowed opacity-70",
                  )}
                  title={lastTerminal ? "Mindestens eine Phase muss abgeschlossen sein" : undefined}
                >
                  Abgeschlossen
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${column.label} löschen`}
                  disabled={onlyColumn || lastTerminal}
                  onClick={() => {
                    const fallback = columns.find((other) => other.id !== column.id);
                    if (fallback) handleRemove(column.id, column.label, fallback.id);
                  }}
                >
                  <Trash2 className="size-4 text-danger" aria-hidden />
                </Button>
              </div>
            );
          })}
        </div>

        <AddColumnRow />
      </DialogContent>
    </Dialog>
  );
}
