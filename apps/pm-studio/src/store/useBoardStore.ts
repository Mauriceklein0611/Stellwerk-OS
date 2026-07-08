import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { BoardView } from "@/lib/board";
import { columnLabel, terminalColumnIds } from "@/lib/board";
import type { SwimlaneMode } from "@/lib/swimlanes";
import { detachAssignee } from "@/lib/assignment";
import { detachStoryTasks } from "@/lib/story-tasks";
import { detachTaskTags } from "@/lib/tags";
import { logActivity } from "@/store/useActivityStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import type { BoardColumn, BoardTask } from "@/types";

type BoardState = {
  tasks: BoardTask[];
  /** Persisted board view: Kanban or Scrum list (TASK-023). */
  view: BoardView;
  /**
   * Whether the user has toggled the view on the board itself. Until then the
   * board follows the `defaultBoardView` setting (TASK-029); an explicit toggle
   * wins from then on.
   */
  viewExplicit: boolean;
  setView: (view: BoardView) => void;
  /** Persisted swimlane grouping dimension for the Kanban board (TASK-036). */
  groupBy: SwimlaneMode;
  setGroupBy: (groupBy: SwimlaneMode) => void;
  /** Appends to the end of the task's column; `order` is assigned automatically. */
  addTask: (task: Omit<BoardTask, "order">) => void;
  updateTask: (id: string, patch: Partial<Omit<BoardTask, "id">>) => void;
  /** Delete a task (TASK-040). Undo restores via `restore` with a snapshot. */
  removeTask: (id: string) => void;
  /**
   * Moves a task into `column`, inserted directly before `beforeId` (or at
   * the end of the column if omitted). Reassigns `order` for that column.
   */
  moveTask: (id: string, column: BoardColumn, beforeId?: string) => void;
  hasStoryTask: (storyId: string) => boolean;
  /**
   * Decouple a deleted story's tasks (TASK-037): keeps the board tasks but drops
   * their `storyId` so nothing dangles. Called when a story disappears (project
   * removed or backlog regenerated, see useProjectStore).
   */
  detachStory: (storyId: string) => void;
  /**
   * Decouple a deleted tag (TASK-031): drop its id from every task's `tagIds`
   * so no item references a tag that no longer exists. Called by
   * useTagStore.removeTag.
   */
  detachTag: (tagId: string) => void;
  /**
   * Decouple a deleted person (TASK-040): clear `assigneeId` on every task they
   * were assigned to, so no task references a person that no longer exists.
   * Called by usePeopleStore.removePerson (same pattern as detachTag).
   */
  detachAssignee: (personId: string) => void;
  /**
   * Replace the task list wholesale (TASK-040). Used by the safe-delete Undo to
   * restore a pre-delete snapshot 1:1, including any cascade cleanup that ran
   * (detached assignees/stories, relocated columns).
   */
  restore: (tasks: BoardTask[]) => void;
  /**
   * Move every task of a deleted phase into `toColumn` (TASK-032): when a board
   * column is removed its tasks must not dangle on a column id that no longer
   * exists. Moved tasks are appended to the target column (order reassigned) and
   * `doneAt` is kept in sync via `stampDone`. Called by
   * useBoardColumnsStore.removeColumn.
   */
  reassignColumn: (fromColumn: BoardColumn, toColumn: BoardColumn) => void;
};

function nextOrder(tasks: BoardTask[], column: BoardColumn): number {
  const columnTasks = tasks.filter((task) => task.column === column);
  return columnTasks.length
    ? Math.max(...columnTasks.map((task) => task.order)) + 1
    : 0;
}

/** Current terminal phase ids from the columns store (TASK-032b). */
function terminals(): Set<BoardColumn> {
  return terminalColumnIds(useBoardColumnsStore.getState().columns);
}

/** Human label of a phase from the live columns store (for activity summaries). */
function phaseLabel(id: BoardColumn): string {
  return columnLabel(id, useBoardColumnsStore.getState().columns);
}

/**
 * Keep `doneAt` in sync with the task's column (TASK-026): entering a terminal
 * phase (≙ "done", TASK-032b) stamps the current time (once – reordering within
 * a terminal phase keeps the original timestamp), leaving a terminal phase
 * clears it. Idempotent, so it can be applied to any task after a column
 * assignment without side effects.
 */
function stampDone(
  task: BoardTask,
  terminalColumns: Set<BoardColumn> = terminals(),
): BoardTask {
  if (terminalColumns.has(task.column)) {
    return task.doneAt ? task : { ...task, doneAt: new Date().toISOString() };
  }
  if (task.doneAt === undefined) return task;
  const next = { ...task };
  delete next.doneAt;
  return next;
}

/**
 * Kanban board tasks, persisted to localStorage. Replaced by the backend
 * store from M6 on.
 */
export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      tasks: [],
      view: "kanban",
      viewExplicit: false,
      setView: (view) => set({ view, viewExplicit: true }),
      groupBy: "none",
      setGroupBy: (groupBy) => set({ groupBy }),
      addTask: (task) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            stampDone({ ...task, order: nextOrder(state.tasks, task.column) }),
          ],
        }));
        // Allocate the readable item key (TASK-064) outside the updater. Tasks
        // and stories of a project share one running sequence.
        useItemKeyStore
          .getState()
          .assignKey(task.id, task.projectId, task.projectName);
        logActivity({
          entityType: "task",
          entityId: task.id,
          kind: "create",
          summary: `Task „${task.title}“ angelegt`,
        });
      },
      updateTask: (id, patch) => {
        // Only a column change is worth a feed entry (TASK-043 granularity):
        // plain field edits would spam the log. Capture the move before set().
        const before = get().tasks.find((task) => task.id === id);
        const movedTo =
          before && patch.column && patch.column !== before.column
            ? patch.column
            : undefined;
        set((state) => {
          const current = state.tasks.find((task) => task.id === id);
          if (!current) return state;

          if (patch.column && patch.column !== current.column) {
            const rest = state.tasks.filter((task) => task.id !== id);
            return {
              tasks: [
                ...rest,
                stampDone({ ...current, ...patch, order: nextOrder(rest, patch.column) }),
              ],
            };
          }

          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? stampDone({ ...task, ...patch }) : task,
            ),
          };
        });
        if (before && movedTo) {
          logActivity({
            entityType: "task",
            entityId: id,
            kind: "update",
            summary: `Task „${before.title}“ nach „${phaseLabel(movedTo)}“ verschoben`,
          });
        }
      },
      removeTask: (id) => {
        const before = get().tasks.find((task) => task.id === id);
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
        if (before) {
          logActivity({
            entityType: "task",
            entityId: id,
            kind: "delete",
            summary: `Task „${before.title}“ gelöscht`,
          });
        }
      },
      moveTask: (id, column, beforeId) => {
        // Log only a real column change – reordering within a column is not an
        // event (TASK-043 granularity).
        const prev = get().tasks.find((task) => task.id === id);
        const changedColumn = prev && prev.column !== column;
        set((state) => {
          const moved = state.tasks.find((task) => task.id === id);
          if (!moved) return state;

          const others = state.tasks.filter(
            (task) => task.id !== id && task.column !== column,
          );
          const columnTasks = state.tasks
            .filter((task) => task.id !== id && task.column === column)
            .sort((a, b) => a.order - b.order);

          const insertAt = beforeId
            ? columnTasks.findIndex((task) => task.id === beforeId)
            : -1;
          columnTasks.splice(
            insertAt === -1 ? columnTasks.length : insertAt,
            0,
            { ...moved, column },
          );

          const terminalColumns = terminals();
          return {
            tasks: [
              ...others,
              ...columnTasks.map((task, i) =>
                stampDone({ ...task, order: i }, terminalColumns),
              ),
            ],
          };
        });
        if (prev && changedColumn) {
          logActivity({
            entityType: "task",
            entityId: id,
            kind: "update",
            summary: `Task „${prev.title}“ nach „${phaseLabel(column)}“ verschoben`,
          });
        }
      },
      hasStoryTask: (storyId) => get().tasks.some((task) => task.storyId === storyId),
      detachStory: (storyId) =>
        set((state) => ({ tasks: detachStoryTasks(state.tasks, storyId) })),
      detachTag: (tagId) =>
        set((state) => ({ tasks: detachTaskTags(state.tasks, tagId) })),
      detachAssignee: (personId) =>
        set((state) => ({ tasks: detachAssignee(state.tasks, personId) })),
      restore: (tasks) => set({ tasks }),
      reassignColumn: (fromColumn, toColumn) =>
        set((state) => {
          if (fromColumn === toColumn) return state;
          const moved = state.tasks.filter((task) => task.column === fromColumn);
          if (moved.length === 0) return state;

          const rest = state.tasks.filter((task) => task.column !== fromColumn);
          const terminalColumns = terminals();
          let order = nextOrder(rest, toColumn);
          return {
            tasks: [
              ...rest,
              ...moved
                .sort((a, b) => a.order - b.order)
                .map((task) =>
                  stampDone(
                    { ...task, column: toColumn, order: order++ },
                    terminalColumns,
                  ),
                ),
            ],
          };
        }),
    }),
    {
      name: "pm-studio-board",
      version: 8,
      partialize: (state) => ({
        tasks: state.tasks,
        view: state.view,
        viewExplicit: state.viewExplicit,
        groupBy: state.groupBy,
      }),
      /**
       * v1 → v2 (TASK-020): the free-text `assignee` placeholder is replaced by
       * a real `assigneeId` person reference. Legacy strings are dropped so old
       * tasks default cleanly to "not assigned" instead of breaking.
       *
       * v2 → v3 (TASK-026): `doneAt` is additive – existing tasks keep their
       * data unchanged. Tasks already sitting in `done` simply have no timestamp
       * and the burndown treats them as completed at sprint start.
       *
       * v3 → v4 (TASK-029): `viewExplicit` is added. Existing users already have
       * a persisted `view`, so we treat that as an explicit choice (`true`) and
       * keep it; only brand-new installs follow the `defaultBoardView` setting.
       *
       * v4 → v5 (TASK-031): `tagIds` is additive – existing tasks keep their
       * data unchanged and default to "no tags". No transform needed.
       *
       * v5 → v6 (TASK-034): `dueDate` is additive – existing tasks keep their
       * data unchanged and default to "no due date". No transform needed.
       *
       * v6 → v7 (TASK-035): `checklist` is additive – existing tasks keep their
       * data unchanged and default to "no checklist". No transform needed.
       *
       * v7 → v8 (TASK-036): `groupBy` (swimlane grouping) is additive – missing
       * value falls back to the initializer default ("none"). No transform needed.
       */
      migrate: (persisted, version) => {
        const state = persisted as
          | { tasks?: BoardTask[]; viewExplicit?: boolean }
          | undefined;
        if (!state?.tasks) return state as { tasks: BoardTask[] };
        if (version < 2) {
          state.tasks = state.tasks.map((task) => {
            if (!("assignee" in task)) return task;
            const next = { ...task } as BoardTask & { assignee?: string };
            delete next.assignee;
            return next;
          });
        }
        if (version < 4) {
          state.viewExplicit = true;
        }
        return state as { tasks: BoardTask[] };
      },
    },
  ),
);
