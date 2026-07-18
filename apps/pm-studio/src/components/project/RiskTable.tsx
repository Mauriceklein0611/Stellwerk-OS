"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { Button } from "@/components/ui/button";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import {
  RiskDialog,
  type RiskDialogTarget,
} from "@/components/project/RiskDialog";
import { addRisk, removeRisk, riskStatusBadge, updateRisk } from "@/lib/risk";
import { severityBadge } from "@/lib/severity";
import type { RiskEntry } from "@/types";

function SortHeader({
  column,
  children,
}: {
  column: Column<RiskEntry, unknown>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
    >
      {children}
      <ArrowUpDown className="size-3.5" />
    </button>
  );
}

const badgeCell = (value: RiskEntry["priority"]) => {
  const badge = severityBadge(value);
  return <StatusBadge status={badge.status} label={badge.label} />;
};

type RiskTableProps = {
  risks: RiskEntry[];
  /**
   * Persist the next risks array (TASK-045). The table edits transactionally
   * and hands back the full array – the parent patches the project artifact.
   */
  onChange: (risks: RiskEntry[]) => void;
};

/** Sortable, editable risk register (TanStack); add/edit/delete (TASK-045). */
export function RiskTable({ risks, onChange }: RiskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "priority", desc: false },
  ]);
  const [dialog, setDialog] = useState<RiskDialogTarget>(null);
  const confirmDelete = useConfirmDelete();

  const handleDelete = (risk: RiskEntry) => {
    const before = risks;
    void confirmDelete({
      confirm: {
        title: `Risiko „${risk.title}“ löschen?`,
        description: "Das Risiko wird aus dem Register entfernt.",
      },
      toastMessage: `Risiko „${risk.title}“ gelöscht.`,
      perform: () => onChange(removeRisk(risks, risk.id)),
      undo: () => onChange(before),
    });
  };

  const columns = useMemo<ColumnDef<RiskEntry>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <SortHeader column={column}>Risiko</SortHeader>,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "owner",
        header: ({ column }) => <SortHeader column={column}>Verantwortlich</SortHeader>,
        cell: ({ row }) =>
          row.original.owner ? (
            <span className="text-foreground">{row.original.owner}</span>
          ) : (
            <span className="text-muted">–</span>
          ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
        cell: ({ row }) => {
          const badge = riskStatusBadge(row.original.status);
          return <StatusBadge status={badge.status} label={badge.label} />;
        },
      },
      {
        accessorKey: "probability",
        header: ({ column }) => (
          <SortHeader column={column}>Wahrscheinlichkeit</SortHeader>
        ),
        cell: ({ row }) => badgeCell(row.original.probability),
      },
      {
        accessorKey: "impact",
        header: ({ column }) => <SortHeader column={column}>Auswirkung</SortHeader>,
        cell: ({ row }) => badgeCell(row.original.impact),
      },
      {
        accessorKey: "mitigation",
        header: "Maßnahme",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted">{row.original.mitigation ?? "–"}</span>
        ),
      },
      {
        accessorKey: "escalation",
        header: "Eskalation",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted">{row.original.escalation ?? "–"}</span>
        ),
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <SortHeader column={column}>Priorität</SortHeader>,
        cell: ({ row }) => badgeCell(row.original.priority),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aktionen</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Risiko „${row.original.title}“ bearbeiten`}
              onClick={() => setDialog({ mode: "edit", risk: row.original })}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Risiko „${row.original.title}“ löschen`}
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    // handleDelete closes over `risks`; rebuilding on risks change keeps it fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [risks],
  );

  const table = useReactTable({
    data: risks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSubmit = (values: Parameters<typeof addRisk>[1]) => {
    if (dialog?.mode === "edit") {
      onChange(updateRisk(risks, dialog.risk.id, values));
    } else {
      onChange(addRisk(risks, values));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ mode: "add" })}>
          <Plus className="size-4" aria-hidden />
          Risiko hinzufügen
        </Button>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Noch keine Risiken erfasst – über „Risiko hinzufügen“ anlegen.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border bg-surface"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RiskDialog
        target={dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
