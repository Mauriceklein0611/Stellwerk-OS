"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import {
  type Column,
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import { useHydrated } from "@/lib/use-hydrated";
import { formatDate } from "@/lib/format";
import { APPROACH_LABELS } from "@/lib/idea-schema";
import type { ProjectIdea } from "@/types";

function SortHeader({
  column,
  children,
}: {
  column: Column<ProjectIdea, unknown>;
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

const columns: ColumnDef<ProjectIdea>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column}>Name</SortHeader>,
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}`}
        className="font-medium text-foreground transition-colors hover:text-primary"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "approach",
    header: ({ column }) => <SortHeader column={column}>Vorgehen</SortHeader>,
    cell: ({ row }) => APPROACH_LABELS[row.original.approach],
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: () => <Badge variant="secondary">Idee</Badge>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortHeader column={column}>Erstellt</SortHeader>,
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

export function IdeaTable() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const table = useReactTable({
    data: ideas,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Until hydrated, render a placeholder so server and client markup match
  // (the ideas live in localStorage and are unknown on the server).
  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted">Noch keine Projektideen erfasst.</p>
        <Button nativeButton={false} render={<Link href="/ideas/new" />}>
          Erste Idee anlegen
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-surface-hover"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
