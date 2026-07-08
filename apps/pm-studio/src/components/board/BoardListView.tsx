"use client";

import { Fragment, type ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  type Column,
  type ColumnDef,
  type Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { ChecklistProgressBadge } from "@/components/board/ChecklistProgress";
import { DueBadge } from "@/components/board/DueBadge";
import { TagChips } from "@/components/tags/TagChips";
import {
  EditableSelectCell,
  type SelectCellOption,
} from "@/components/board/cells/EditableSelectCell";
import { EditableTextCell } from "@/components/board/cells/EditableTextCell";
import { columnStatus, isTerminalColumn } from "@/lib/board";
import { severityBadge } from "@/lib/severity";
import { initials } from "@/lib/people";
import {
  summarizeBoardRows,
  type BoardRow,
  type BoardRowSummary,
} from "@/lib/board-rows";
import { UNGROUPED_LANE, type Swimlane, type SwimlaneMode } from "@/lib/swimlanes";
import type {
  BoardColumn,
  BoardColumnDef,
  BoardTask,
  Person,
  PlannedSprint,
  Priority,
} from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Select sentinels for "not assigned" / "no sprint" (Select items can't hold ""). */
const UNASSIGNED = "unassigned";
const NO_SPRINT = "no-sprint";

/** Handlers + lookup data passed to the editable cells via the table meta. */
type BoardListMeta = {
  onUpdateTask: (id: string, patch: Partial<Omit<BoardTask, "id">>) => void;
  /** Sprint membership lives on the story, not the task – set via the sprint store. */
  onAssignSprint: (storyId: string, sprintId: string | null) => void;
  persons: Person[];
  sprints: PlannedSprint[];
  /** Status dropdown options derived from the configurable phases (TASK-032). */
  statusOptions: SelectCellOption[];
  /** Configurable phases for resolving a row's status accent (TASK-032). */
  columns: BoardColumnDef[];
  /** Client-side "today" (ISO) for the due-date indicator (TASK-034). */
  today: string;
};

const PRIORITY_OPTIONS: SelectCellOption[] = PRIORITIES.map((priority) => {
  const badge = severityBadge(priority);
  return {
    value: priority,
    label: badge.label,
    node: <StatusBadge status={badge.status} label={badge.label} />,
  };
});

/** Avatar + name node reused for the assignee trigger and dropdown items. */
function assigneeNode(name: string): ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.6rem] font-medium text-muted-foreground"
      >
        {initials(name)}
      </span>
      <span className="text-foreground">{name}</span>
    </span>
  );
}

function SortHeader({
  column,
  children,
}: {
  column: Column<BoardRow, unknown>;
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

const columns: ColumnDef<BoardRow>[] = [
  {
    id: "itemKey",
    accessorFn: (row) => row.itemKey ?? row.shortId,
    header: ({ column }) => <SortHeader column={column}>Key</SortHeader>,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted">
        {row.original.itemKey ?? row.original.shortId}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortHeader column={column}>Titel</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { id, title } = row.original;
      return (
        <EditableTextCell
          value={title}
          ariaLabel={`Titel von ${title}`}
          className="font-medium text-foreground"
          onCommit={(raw) => {
            const next = raw.trim();
            if (!next || next === title) return;
            meta.onUpdateTask(id, { title: next });
          }}
        />
      );
    },
  },
  {
    accessorKey: "columnLabel",
    header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { id, column, title } = row.original;
      return (
        <EditableSelectCell
          ariaLabel={`Status von ${title}`}
          value={column}
          options={meta.statusOptions}
          onChange={(value) =>
            meta.onUpdateTask(id, { column: value as BoardColumn })
          }
        />
      );
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortHeader column={column}>Priorität</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { id, priority, title } = row.original;
      return (
        <EditableSelectCell
          ariaLabel={`Priorität von ${title}`}
          value={priority}
          options={PRIORITY_OPTIONS}
          onChange={(value) =>
            meta.onUpdateTask(id, { priority: value as Priority })
          }
        />
      );
    },
  },
  {
    accessorKey: "estimatePt",
    header: ({ column }) => <SortHeader column={column}>PT</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { id, estimatePt, title } = row.original;
      return (
        <EditableTextCell
          type="number"
          value={estimatePt}
          ariaLabel={`PT von ${title}`}
          className="font-mono text-xs text-muted"
          onCommit={(raw) => {
            const trimmed = raw.trim();
            if (trimmed === "") {
              meta.onUpdateTask(id, { estimate_pt: undefined });
              return;
            }
            const value = Number(trimmed);
            if (!Number.isFinite(value) || value < 0) return;
            meta.onUpdateTask(id, { estimate_pt: value });
          }}
        />
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <SortHeader column={column}>Fällig</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { dueDate, column } = row.original;
      if (!dueDate) return <span className="text-muted">–</span>;
      return (
        <DueBadge
          dueDate={dueDate}
          today={meta.today}
          done={isTerminalColumn(column, meta.columns)}
        />
      );
    },
  },
  {
    accessorKey: "assigneeName",
    header: ({ column }) => <SortHeader column={column}>Zuständig</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { id, title } = row.original;
      const options: SelectCellOption[] = [
        {
          value: UNASSIGNED,
          label: "Nicht zugewiesen",
          node: <span className="text-muted">Nicht zugewiesen</span>,
        },
        ...meta.persons.map((person) => ({
          value: person.id,
          label: person.name,
          node: assigneeNode(person.name),
        })),
      ];
      return (
        <EditableSelectCell
          ariaLabel={`Zuständig für ${title}`}
          value={row.original.task.assigneeId ?? UNASSIGNED}
          options={options}
          onChange={(value) =>
            meta.onUpdateTask(id, {
              assigneeId: value === UNASSIGNED ? undefined : value,
            })
          }
        />
      );
    },
  },
  {
    id: "checklist",
    header: () => <span>Checkliste</span>,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.checklist?.length ? (
        <ChecklistProgressBadge items={row.original.checklist} />
      ) : (
        <span className="text-muted">–</span>
      ),
  },
  {
    id: "tags",
    header: () => <span>Tags</span>,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.tags.length ? (
        <TagChips tags={row.original.tags} max={2} />
      ) : (
        <span className="text-muted">–</span>
      ),
  },
  {
    accessorKey: "sprintName",
    header: ({ column }) => <SortHeader column={column}>Sprint</SortHeader>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as BoardListMeta;
      const { task, title } = row.original;
      const storyId = task.storyId;
      if (!storyId) {
        return (
          <EditableSelectCell
            disabled
            ariaLabel={`Sprint von ${title}`}
            value={NO_SPRINT}
            options={[]}
            onChange={() => {}}
          />
        );
      }
      const projectSprints = meta.sprints.filter(
        (sprint) => sprint.projectId === task.projectId,
      );
      const current = projectSprints.find((sprint) =>
        sprint.storyIds.includes(storyId),
      );
      const options: SelectCellOption[] = [
        {
          value: NO_SPRINT,
          label: "Ohne Sprint",
          node: <span className="text-muted">Ohne Sprint</span>,
        },
        ...projectSprints.map((sprint) => ({
          value: sprint.id,
          label: sprint.name,
        })),
      ];
      return (
        <EditableSelectCell
          ariaLabel={`Sprint von ${title}`}
          value={current?.id ?? NO_SPRINT}
          options={options}
          onChange={(value) =>
            meta.onAssignSprint(storyId, value === NO_SPRINT ? null : value)
          }
        />
      );
    },
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => <SortHeader column={column}>Projekt</SortHeader>,
    cell: ({ row }) => (
      <span className="text-muted">{row.original.projectName}</span>
    ),
  },
];

type BoardListViewProps = {
  rows: BoardRow[];
  /** Configurable phases for the status dropdown/accent (TASK-032). */
  columns: BoardColumnDef[];
  /**
   * Lane sections for grouped display – reuse of the Kanban swimlanes so order
   * and "ohne Zuordnung" placement match exactly (TASK-036/063). Only read when
   * `groupBy !== "none"`; defaults to a flat list.
   */
  lanes?: Swimlane[];
  /** Active grouping dimension shared with the Kanban view (TASK-063). */
  groupBy?: SwimlaneMode;
  /** Row click (outside the editable cells) opens the TaskDialog (TASK-023). */
  onRowClick: (task: BoardTask) => void;
  /** Inline-edit save for title/status/priority/assignee/PT (TASK-030). */
  onUpdateTask: (id: string, patch: Partial<Omit<BoardTask, "id">>) => void;
  /** Inline sprint change (story-level membership, TASK-030). */
  onAssignSprint: (storyId: string, sprintId: string | null) => void;
  persons: Person[];
  sprints: PlannedSprint[];
  /** Client-side "today" (ISO) for the due-date indicator (TASK-034). */
  today: string;
};

/** Inline count + Σ planned/done PT, shared by the group headers and the footer. */
function RowSummary({ summary }: { summary: BoardRowSummary }) {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted">
      <span>
        <span className="font-medium text-foreground">{summary.count}</span>{" "}
        {summary.count === 1 ? "Task" : "Tasks"}
      </span>
      <span>
        Σ geplant{" "}
        <span className="font-mono font-medium text-foreground">
          {summary.plannedPt} PT
        </span>
      </span>
      <span>
        Σ erledigt{" "}
        <span className="font-mono font-medium text-foreground">
          {summary.donePt} PT
        </span>
      </span>
    </span>
  );
}

/**
 * Octane-style sortable work-item grid (TASK-023). Cells are inline-editable
 * (TASK-030): clicking a value edits it in place; clicking elsewhere in the row
 * opens the TaskDialog. Editable controls stop click propagation so the two
 * never conflict.
 */
export function BoardListView({
  rows,
  columns: boardColumns,
  lanes = [],
  groupBy = "none",
  onRowClick,
  onUpdateTask,
  onAssignSprint,
  persons,
  sprints,
  today,
}: BoardListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "columnLabel", desc: false },
  ]);

  const statusOptions = useMemo<SelectCellOption[]>(
    () =>
      boardColumns.map((column) => ({
        value: column.id,
        label: column.label,
        node: (
          <StatusBadge status={columnStatus(column.id, boardColumns)} label={column.label} />
        ),
      })),
    [boardColumns],
  );

  const meta = useMemo<BoardListMeta>(
    () => ({
      onUpdateTask,
      onAssignSprint,
      persons,
      sprints,
      statusOptions,
      columns: boardColumns,
      today,
    }),
    [onUpdateTask, onAssignSprint, persons, sprints, statusOptions, boardColumns, today],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Keine Tasks vorhanden.
      </div>
    );
  }

  const sortedRows = table.getRowModel().rows;
  const colSpan = table.getVisibleLeafColumns().length;
  const grouped = groupBy !== "none";

  // Partition the already-sorted row model into lane sections (TASK-063). Lanes
  // come from the shared `buildSwimlanes` (same source as the Kanban swimlanes),
  // so lane order + "ohne Zuordnung"-last match; filtering the sorted rows keeps
  // the TanStack sort order within each group.
  const sections = grouped
    ? lanes.map((lane) => {
        const ids = new Set(lane.tasks.map((task) => task.id));
        const laneRows = sortedRows.filter((row) => ids.has(row.original.id));
        return {
          lane,
          rows: laneRows,
          summary: summarizeBoardRows(
            laneRows.map((row) => row.original),
            boardColumns,
          ),
        };
      })
    : [];

  const total = summarizeBoardRows(
    sortedRows.map((row) => row.original),
    boardColumns,
  );

  const renderDataRow = (row: Row<BoardRow>) => (
    <tr
      key={row.id}
      data-testid={`board-row-${row.original.id}`}
      onClick={() => onRowClick(row.original.task)}
      className="cursor-pointer border-b border-border hover:bg-surface-hover"
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-surface">
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
          {grouped
            ? sections.map(({ lane, rows: laneRows, summary }) => (
                <Fragment key={lane.id}>
                  <tr
                    data-testid={`board-group-${lane.id}`}
                    className="border-b border-border bg-surface/60"
                  >
                    <td colSpan={colSpan} className="px-4 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span
                          className={
                            lane.id === UNGROUPED_LANE
                              ? "text-sm font-medium text-muted"
                              : "text-sm font-medium text-foreground"
                          }
                        >
                          {lane.label}
                        </span>
                        <RowSummary summary={summary} />
                      </div>
                    </td>
                  </tr>
                  {laneRows.map(renderDataRow)}
                </Fragment>
              ))
            : sortedRows.map(renderDataRow)}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface">
            <td colSpan={colSpan} className="px-4 py-3" data-testid="board-list-footer">
              <RowSummary summary={total} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
