"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import { AddColumnTile } from "@/components/board/AddColumnTile";
import { BoardSwimlanes } from "@/components/board/BoardSwimlanes";
import { TaskDialog } from "@/components/board/TaskDialog";
import { BoardListView } from "@/components/board/BoardListView";
import { BoardViewToggle } from "@/components/board/BoardViewToggle";
import { SwimlaneSelect } from "@/components/board/SwimlaneSelect";
import { ColumnManager } from "@/components/board/ColumnManager";
import { TagManager } from "@/components/tags/TagManager";
import { FilterBar, type FilterControl } from "@/components/common/FilterBar";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useSprintStore } from "@/store/useSprintStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useTagStore } from "@/store/useTagStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHydrated } from "@/lib/use-hydrated";
import { terminalColumnIds } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import { buildSwimlanes, laneReassignment } from "@/lib/swimlanes";
import { severityBadge } from "@/lib/severity";
import {
  ALL,
  NO_SPRINT,
  OVERDUE,
  UNASSIGNED,
  emptyBoardFilter,
  filterBoardTasks,
  isBoardFilterActive,
  type BoardFilter,
} from "@/lib/board-filters";
import type { BoardColumn, BoardTask, Priority } from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

export default function BoardPage() {
  const hydrated = useHydrated();
  const tasks = useBoardStore((state) => state.tasks);
  const moveTask = useBoardStore((state) => state.moveTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const addTask = useBoardStore((state) => state.addTask);
  const removeTask = useBoardStore((state) => state.removeTask);
  const restoreTasks = useBoardStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();
  const storedView = useBoardStore((state) => state.view);
  const viewExplicit = useBoardStore((state) => state.viewExplicit);
  const setView = useBoardStore((state) => state.setView);
  const groupBy = useBoardStore((state) => state.groupBy);
  const setGroupBy = useBoardStore((state) => state.setGroupBy);
  const defaultBoardView = useSettingsStore((state) => state.defaultBoardView);
  // Until the user toggles on the board, follow the settings default (TASK-029).
  const view = viewExplicit ? storedView : defaultBoardView;
  const ideas = useProjectStore((state) => state.ideas);
  const sprints = useSprintStore((state) => state.sprints);
  const assignStory = useSprintStore((state) => state.assignStory);
  const persons = usePeopleStore((state) => state.persons);
  const tags = useTagStore((state) => state.tags);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const addColumn = useBoardColumnsStore((state) => state.addColumn);
  const itemKeys = useItemKeyStore((state) => state.keys);

  const [filter, setFilter] = useState<BoardFilter>(emptyBoardFilter);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);

  // Local "today" as ISO date – only meaningful past the hydration gate below,
  // so the due-date indicator/filter cause no SSR mismatch (TASK-034, TASK-024).
  const today = hydrated ? new Date().toLocaleDateString("sv-SE") : "";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

  const visibleTasks = useMemo(
    () => filterBoardTasks(tasks, filter, sprints, today, terminalColumns),
    [tasks, filter, sprints, today, terminalColumns],
  );

  const columns = useMemo(
    () =>
      boardColumns.map((column) => ({
        column,
        tasks: visibleTasks
          .filter((task) => task.column === column.id)
          .sort((a, b) => a.order - b.order),
      })),
    [visibleTasks, boardColumns],
  );

  const lanes = useMemo(
    () => buildSwimlanes(visibleTasks, groupBy, { persons, sprints, tags }),
    [visibleTasks, groupBy, persons, sprints, tags],
  );

  const rows = useMemo(
    () =>
      buildBoardRows(visibleTasks, persons, sprints, tags, boardColumns, itemKeys),
    [visibleTasks, persons, sprints, tags, boardColumns, itemKeys],
  );

  const set = (patch: Partial<BoardFilter>) =>
    setFilter((current) => ({ ...current, ...patch }));

  const controls: FilterControl[] = [
    {
      id: "project",
      label: "Projekt",
      value: filter.projectId,
      onChange: (projectId) => set({ projectId }),
      options: [
        { value: ALL, label: "Alle Projekte" },
        ...ideas.map((idea) => ({ value: idea.id, label: idea.name })),
      ],
    },
    {
      id: "sprint",
      label: "Sprint",
      value: filter.sprintId,
      onChange: (sprintId) => set({ sprintId }),
      options: [
        { value: ALL, label: "Alle Sprints" },
        { value: NO_SPRINT, label: "Ohne Sprint" },
        ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
      ],
    },
    {
      id: "person",
      label: "Person",
      value: filter.assigneeId,
      onChange: (assigneeId) => set({ assigneeId }),
      options: [
        { value: ALL, label: "Alle Personen" },
        { value: UNASSIGNED, label: "Nicht zugewiesen" },
        ...persons.map((person) => ({ value: person.id, label: person.name })),
      ],
    },
    {
      id: "priority",
      label: "Priorität",
      value: filter.priority,
      onChange: (priority) => set({ priority }),
      options: [
        { value: ALL, label: "Alle Prioritäten" },
        ...PRIORITIES.map((priority) => ({
          value: priority,
          label: severityBadge(priority).label,
        })),
      ],
    },
    {
      id: "column",
      label: "Spalte",
      value: filter.column,
      onChange: (column) => set({ column }),
      options: [
        { value: ALL, label: "Alle Spalten" },
        ...boardColumns.map((column) => ({
          value: column.id,
          label: column.label,
        })),
      ],
    },
    {
      id: "tag",
      label: "Tag",
      value: filter.tagId,
      onChange: (tagId) => set({ tagId }),
      options: [
        { value: ALL, label: "Alle Tags" },
        ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
      ],
    },
    {
      id: "due",
      label: "Fälligkeit",
      value: filter.due,
      onChange: (due) => set({ due }),
      options: [
        { value: ALL, label: "Alle Termine" },
        { value: OVERDUE, label: "Überfällig" },
      ],
    },
  ];

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  // Quick-add (TASK-033) needs a single project for the new task. Use the
  // active project filter; with "all projects" there is no unambiguous target,
  // so quick-add is disabled with a hint.
  const quickAddProject =
    filter.projectId === ALL
      ? undefined
      : ideas.find((idea) => idea.id === filter.projectId);

  function handleQuickAdd(column: BoardColumn, title: string) {
    if (!quickAddProject) return;
    addTask({
      id: crypto.randomUUID(),
      title,
      column,
      projectId: quickAddProject.id,
      projectName: quickAddProject.name,
      priority: "mittel",
    });
  }

  function handleDeleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const tasksBefore = useBoardStore.getState().tasks;
    void confirmDelete({
      confirm: {
        title: `Task „${task.title}“ löschen?`,
        description: "Der Task wird vom Board entfernt.",
      },
      toastMessage: `Task „${task.title}“ gelöscht.`,
      perform: () => removeTask(id),
      undo: () => restoreTasks(tasksBefore),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Read column + lane from the drag payload (TASK-036) instead of parsing ids,
    // so flat and swimlane layouts share one handler. `over` is either a task
    // (sortable → insert before it) or an empty column (droppable → append).
    const overData = over.data.current as
      | { type: "task" | "column"; columnId: BoardColumn; laneId?: string; taskId?: string }
      | undefined;
    if (!overData) return;

    const activeId = String(active.id);
    const beforeId = overData.type === "task" ? overData.taskId : undefined;
    moveTask(activeId, overData.columnId, beforeId);

    // Cross-lane drop → also reassign the grouping dimension (assignee/sprint);
    // tag lanes change the column only (membership is edited in the dialog).
    if (overData.laneId === undefined) return;
    const reassign = laneReassignment(groupBy, overData.laneId);
    if (reassign.kind === "assignee") {
      updateTask(activeId, { assigneeId: reassign.assigneeId });
    } else if (reassign.kind === "sprint") {
      const storyId = tasks.find((task) => task.id === activeId)?.storyId;
      if (storyId) assignStory(storyId, reassign.sprintId);
    }
  }

  const active = isBoardFilterActive(filter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Board"
        description="Kanban-Board oder Scrum-Liste über alle Projekte – gleiche Daten und Filter."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setColumnManagerOpen(true)}>
              Spalten verwalten
            </Button>
            <Button variant="outline" onClick={() => setTagManagerOpen(true)}>
              Tags verwalten
            </Button>
            {/* Grouping applies to both the Kanban swimlanes and the list
                sections – they share the same persisted `groupBy` (TASK-063). */}
            <SwimlaneSelect value={groupBy} onChange={setGroupBy} />
            <BoardViewToggle value={view} onChange={setView} />
          </div>
        }
      />

      <FilterBar
        controls={controls}
        active={active}
        onReset={() => setFilter(emptyBoardFilter)}
      />

      {active && visibleTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="max-w-md text-sm text-muted">
              Keine Tasks für die aktuellen Filter.
            </p>
            <Button variant="outline" onClick={() => setFilter(emptyBoardFilter)}>
              Filter zurücksetzen
            </Button>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <BoardListView
          rows={rows}
          columns={boardColumns}
          lanes={lanes}
          groupBy={groupBy}
          onRowClick={setSelectedTask}
          onUpdateTask={updateTask}
          onAssignSprint={assignStory}
          persons={persons}
          sprints={sprints}
          today={today}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {groupBy === "none" ? (
            <div className="flex items-start gap-4 overflow-x-auto pb-2">
              {columns.map(({ column, tasks: columnTasks }) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onTaskClick={setSelectedTask}
                  today={today}
                  onQuickAdd={handleQuickAdd}
                  quickAddEnabled={Boolean(quickAddProject)}
                  quickAddDisabledHint="Projekt wählen, um Tasks anzulegen"
                />
              ))}
              {/* "+ Spalte" right of the last column – appends a non-terminal
                  phase via the store (TASK-051). Flat Kanban view only. */}
              <AddColumnTile onAdd={(label) => addColumn({ label })} />
            </div>
          ) : (
            <BoardSwimlanes
              lanes={lanes}
              columns={boardColumns}
              onTaskClick={setSelectedTask}
              today={today}
            />
          )}
        </DndContext>
      )}

      <TaskDialog
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onSave={updateTask}
        onDelete={handleDeleteTask}
      />

      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />

      <ColumnManager open={columnManagerOpen} onOpenChange={setColumnManagerOpen} />
    </div>
  );
}
