import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardStore } from "@/store/useBoardStore";
import type { BoardColumn, BoardColumnDef, StatusType } from "@/types";

type BoardColumnsState = {
  /** Phases left → right, kept sorted by `order`. */
  columns: BoardColumnDef[];
  /** Append a new phase at the end with a random id. */
  addColumn: (input: {
    label: string;
    status?: StatusType;
    wipLimit?: number;
    isTerminal?: boolean;
  }) => void;
  renameColumn: (id: BoardColumn, label: string) => void;
  setColumnStatus: (id: BoardColumn, status: StatusType) => void;
  /** Set or clear (undefined) a phase's WIP limit. */
  setColumnWip: (id: BoardColumn, wipLimit: number | undefined) => void;
  /**
   * Toggle whether a phase is terminal (≙ "done"). Refuses to turn off the last
   * terminal phase – at least one must remain so done-semantics stay defined.
   */
  setColumnTerminal: (id: BoardColumn, isTerminal: boolean) => void;
  /** Reorder phases to the given id sequence; unknown ids are ignored. */
  reorderColumns: (orderedIds: BoardColumn[]) => void;
  /**
   * Remove a phase and move its tasks to `fallbackId`. No-ops when removing the
   * last phase, the last terminal phase, or with an invalid fallback, so the
   * board can never end up without columns or without a terminal phase.
   */
  removeColumn: (id: BoardColumn, fallbackId: BoardColumn) => void;
  /** Restore the phases list from a snapshot (TASK-040 safe-delete Undo). */
  restore: (columns: BoardColumnDef[]) => void;
};

/** Re-sequence `order` to match array position (single source for left→right). */
function sequence(columns: BoardColumnDef[]): BoardColumnDef[] {
  return columns.map((column, order) => ({ ...column, order }));
}

const terminalCount = (columns: BoardColumnDef[]): number =>
  columns.filter((column) => column.isTerminal).length;

/**
 * Configurable Kanban phases (TASK-032): create, rename, recolor, set a WIP
 * limit, mark terminal, reorder and delete. Persisted locally; the board reads
 * these instead of the former static constants. Deleting a phase moves its
 * tasks to a fallback column via useBoardStore.reassignColumn so nothing
 * dangles (same cross-store pattern as tag/story detach).
 */
export const useBoardColumnsStore = create<BoardColumnsState>()(
  persist(
    (set) => ({
      columns: DEFAULT_BOARD_COLUMNS,
      addColumn: ({ label, status = "idle", wipLimit, isTerminal = false }) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        set((state) => ({
          columns: sequence([
            ...state.columns,
            {
              id: crypto.randomUUID(),
              label: trimmed,
              status,
              order: state.columns.length,
              wipLimit,
              isTerminal,
            },
          ]),
        }));
      },
      renameColumn: (id, label) =>
        set((state) => ({
          columns: state.columns.map((column) =>
            column.id === id ? { ...column, label } : column,
          ),
        })),
      setColumnStatus: (id, status) =>
        set((state) => ({
          columns: state.columns.map((column) =>
            column.id === id ? { ...column, status } : column,
          ),
        })),
      setColumnWip: (id, wipLimit) =>
        set((state) => ({
          columns: state.columns.map((column) =>
            column.id === id ? { ...column, wipLimit } : column,
          ),
        })),
      setColumnTerminal: (id, isTerminal) =>
        set((state) => {
          // Never let the last terminal phase be turned off.
          if (!isTerminal && terminalCount(state.columns) <= 1) {
            const target = state.columns.find((column) => column.id === id);
            if (target?.isTerminal) return state;
          }
          return {
            columns: state.columns.map((column) =>
              column.id === id ? { ...column, isTerminal } : column,
            ),
          };
        }),
      reorderColumns: (orderedIds) =>
        set((state) => {
          const byId = new Map(state.columns.map((column) => [column.id, column]));
          const next: BoardColumnDef[] = [];
          for (const id of orderedIds) {
            const column = byId.get(id);
            if (column) {
              next.push(column);
              byId.delete(id);
            }
          }
          // Keep any columns missing from the sequence at the end.
          for (const column of state.columns)
            if (byId.has(column.id)) next.push(column);
          return { columns: sequence(next) };
        }),
      removeColumn: (id, fallbackId) => {
        let removed = false;
        set((state) => {
          if (id === fallbackId) return state;
          if (state.columns.length <= 1) return state;
          const target = state.columns.find((column) => column.id === id);
          const fallback = state.columns.find((column) => column.id === fallbackId);
          if (!target || !fallback) return state;
          // Removing the last terminal phase would leave done-semantics undefined.
          if (target.isTerminal && terminalCount(state.columns) <= 1) return state;
          removed = true;
          return {
            columns: sequence(state.columns.filter((column) => column.id !== id)),
          };
        });
        // Only relocate tasks once the column was actually removed.
        if (removed) useBoardStore.getState().reassignColumn(id, fallbackId);
      },
      restore: (columns) => set({ columns }),
    }),
    {
      name: "pm-studio-board-columns",
      version: 1,
      partialize: (state) => ({ columns: state.columns }),
    },
  ),
);
