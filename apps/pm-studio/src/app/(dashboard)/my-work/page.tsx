"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { BoardListView } from "@/components/board/BoardListView";
import { TaskDialog } from "@/components/board/TaskDialog";
import { FilterBar, type FilterControl } from "@/components/common/FilterBar";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useSprintStore } from "@/store/useSprintStore";
import { useTagStore } from "@/store/useTagStore";
import { useHydrated } from "@/lib/use-hydrated";
import { terminalColumnIds } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import {
  filterMyWork,
  myWorkCounts,
  resolveMyWorkPersonId,
  tasksForPerson,
  type MyWorkScope,
} from "@/lib/my-work";
import type { BoardTask } from "@/types";

const SCOPES: { value: MyWorkScope; label: string }[] = [
  { value: "open", label: "Offen" },
  { value: "overdue", label: "Überfällig" },
  { value: "assigned", label: "Alle zugewiesenen" },
];

export default function MyWorkPage() {
  const hydrated = useHydrated();
  const tasks = useBoardStore((state) => state.tasks);
  const updateTask = useBoardStore((state) => state.updateTask);
  const removeTask = useBoardStore((state) => state.removeTask);
  const restoreTasks = useBoardStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();
  const persons = usePeopleStore((state) => state.persons);
  const sprints = useSprintStore((state) => state.sprints);
  const assignStory = useSprintStore((state) => state.assignStory);
  const tags = useTagStore((state) => state.tags);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const itemKeys = useItemKeyStore((state) => state.keys);
  // Stories are not directly needed here, but ideas keep the empty-state CTA honest.
  const ideas = useProjectStore((state) => state.ideas);

  // Explicit person choice; with a later login the logged-in user's id would
  // seed this instead (see resolveMyWorkPersonId), without changing the page.
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [scope, setScope] = useState<MyWorkScope>("open");
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  // Local "today" – only meaningful past the hydration gate below (TASK-034).
  const today = hydrated ? new Date().toLocaleDateString("sv-SE") : "";

  const personId = resolveMyWorkPersonId(selectedPersonId, persons);

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

  const personTasks = useMemo(
    () => tasksForPerson(tasks, personId ?? ""),
    [tasks, personId],
  );

  const counts = useMemo(
    () => myWorkCounts(personTasks, today, terminalColumns),
    [personTasks, today, terminalColumns],
  );

  const visibleTasks = useMemo(
    () => filterMyWork(personTasks, scope, today, terminalColumns),
    [personTasks, scope, today, terminalColumns],
  );

  const rows = useMemo(
    () =>
      buildBoardRows(visibleTasks, persons, sprints, tags, boardColumns, itemKeys),
    [visibleTasks, persons, sprints, tags, boardColumns, itemKeys],
  );

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  // No people yet → My Work has no owner to show; point to the Team page.
  if (persons.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Meine Aufgaben"
          description="Projekt- und storyübergreifende Sicht auf die Arbeit einer Person."
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="max-w-md text-sm text-muted">
              Noch keine Personen angelegt. Lege zuerst ein Teammitglied an, um
              ihm zugewiesene Aufgaben gebündelt zu sehen.
            </p>
            <Link href="/team" className={buttonVariants()}>
              Zum Team
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeOptions: FilterControl["options"] = SCOPES.map(
    ({ value, label }) => ({ value, label }),
  );

  const controls: FilterControl[] = [
    {
      id: "person",
      label: "Person",
      value: personId ?? "",
      onChange: (value) => setSelectedPersonId(value),
      options: persons.map((person) => ({
        value: person.id,
        label: person.name,
      })),
    },
    {
      id: "scope",
      label: "Umfang",
      value: scope,
      onChange: (value) => setScope(value as MyWorkScope),
      options: scopeOptions,
    },
  ];

  const activePerson = persons.find((person) => person.id === personId);

  // Safe delete from the task dialog – shared confirm + toast/undo (TASK-040).
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Meine Aufgaben"
        description="Projekt- und storyübergreifende Sicht auf die Arbeit einer Person – zugewiesen, offen, überfällig."
      />

      <FilterBar controls={controls} active={false} onReset={() => {}} />

      {/* Summary chips per scope (also act as quick filters). */}
      <div className="flex flex-wrap gap-2">
        <CountChip
          label="Zugewiesen"
          count={counts.assigned}
          active={scope === "assigned"}
          onClick={() => setScope("assigned")}
        />
        <CountChip
          label="Offen"
          count={counts.open}
          active={scope === "open"}
          onClick={() => setScope("open")}
        />
        <CountChip
          label="Überfällig"
          count={counts.overdue}
          active={scope === "overdue"}
          onClick={() => setScope("overdue")}
          danger
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="max-w-md text-sm text-muted">
              {ideas.length === 0
                ? "Keine Aufgaben vorhanden – lege zuerst ein Projekt mit Backlog an."
                : `Keine ${
                    SCOPES.find((s) => s.value === scope)?.label.toLowerCase() ??
                    ""
                  } Aufgaben für ${activePerson?.name ?? "diese Person"}.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <BoardListView
          rows={rows}
          columns={boardColumns}
          onRowClick={setSelectedTask}
          onUpdateTask={updateTask}
          onAssignSprint={assignStory}
          persons={persons}
          sprints={sprints}
          today={today}
        />
      )}

      <TaskDialog
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onSave={updateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

function CountChip({
  label,
  count,
  active,
  onClick,
  danger = false,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`my-work-chip-${label.toLowerCase()}`}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted hover:bg-surface-hover hover:text-foreground",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "rounded-full px-1.5 text-xs font-medium",
          danger && count > 0
            ? "bg-danger/15 text-danger"
            : "bg-secondary text-foreground",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}
