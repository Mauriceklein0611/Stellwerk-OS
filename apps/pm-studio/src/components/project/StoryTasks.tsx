"use client";

import Link from "next/link";
import { useState } from "react";
import { ListChecks } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columnLabel, columnStatus } from "@/lib/board";
import { initials } from "@/lib/people";
import { severityBadge } from "@/lib/severity";
import { storyTaskRollup, tasksForStory } from "@/lib/story-tasks";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import type { Priority, UserStory } from "@/types";

const PRIORITIES: Priority[] = ["hoch", "mittel", "niedrig"];

/** Select sentinel for "not assigned" (Select items can't hold ""). */
const UNASSIGNED = "unassigned";

type StoryTasksProps = {
  story: UserStory;
  projectId: string;
  projectName: string;
};

/**
 * Scrum decomposition of a story (TASK-037): lists the story's dev tasks with a
 * roll-up and lets the user add new ones. Tasks are plain board tasks carrying
 * `storyId`, so they show up on board/sprint/velocity without a second model.
 */
export function StoryTasks({ story, projectId, projectName }: StoryTasksProps) {
  const tasks = useBoardStore((state) => state.tasks);
  const addTask = useBoardStore((state) => state.addTask);
  const persons = usePeopleStore((state) => state.persons);
  const boardColumns = useBoardColumnsStore((state) => state.columns);

  const storyTasks = tasksForStory(story.id, tasks, boardColumns);
  const rollup = storyTaskRollup(story.id, tasks, boardColumns);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(story.priority);
  const [pt, setPt] = useState("");
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);

  const trimmed = title.trim();

  function handleAdd() {
    if (!trimmed) return;
    const estimate = Number.parseFloat(pt);
    addTask({
      id: crypto.randomUUID(),
      title: trimmed,
      column: "todo",
      projectId,
      projectName,
      storyId: story.id,
      priority,
      estimate_pt: Number.isFinite(estimate) && estimate > 0 ? estimate : undefined,
      assigneeId: assigneeId === UNASSIGNED ? undefined : assigneeId,
    });
    setTitle("");
    setPriority(story.priority);
    setPt("");
    setAssigneeId(UNASSIGNED);
  }

  return (
    <div
      id={`story-tasks-${story.id}`}
      className="mt-3 scroll-mt-20 rounded-md border border-border bg-secondary p-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ListChecks className="size-3.5 text-muted" aria-hidden />
          Aufgaben
        </span>
        <span className="font-mono text-xs text-muted">
          {rollup.doneTasks}/{rollup.total} · {rollup.donePt}/{rollup.totalPt} PT
        </span>
      </div>

      {storyTasks.length === 0 ? (
        <p className="mt-2 text-xs text-muted">
          Noch keine Aufgaben – zerlege die Story unten in konkrete Tasks.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {storyTasks.map((task) => {
            const badge = severityBadge(task.priority);
            const assignee = persons.find((person) => person.id === task.assigneeId);
            return (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
              >
                <StatusBadge
                  status={columnStatus(task.column, boardColumns)}
                  label={columnLabel(task.column, boardColumns)}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {task.title}
                </span>
                {assignee && (
                  <span
                    aria-hidden
                    title={assignee.name}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.6rem] font-medium text-foreground/80"
                  >
                    {initials(assignee.name)}
                  </span>
                )}
                {typeof task.estimate_pt === "number" && (
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {task.estimate_pt} PT
                  </span>
                )}
                <StatusBadge status={badge.status} label={badge.label} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Neue Aufgabe …"
          aria-label="Aufgabentitel"
          className="h-8 min-w-40 flex-1"
        />
        <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
          <SelectTrigger className="h-8 w-28" aria-label="Priorität">
            <SelectValue>{(value) => severityBadge(value as Priority).label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {severityBadge(p).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={pt}
          onChange={(event) => setPt(event.target.value)}
          type="number"
          min="0"
          step="0.5"
          placeholder="PT"
          aria-label="Personentage"
          className="h-8 w-16"
        />
        <Select value={assigneeId} onValueChange={(value) => setAssigneeId(value ?? UNASSIGNED)}>
          <SelectTrigger className="h-8 w-40" aria-label="Zugewiesen an">
            <SelectValue>
              {(value) =>
                persons.find((person) => person.id === value)?.name ?? "Nicht zugewiesen"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Nicht zugewiesen</SelectItem>
            {persons.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAdd} disabled={!trimmed}>
          Hinzufügen
        </Button>
      </div>

      {storyTasks.length > 0 && (
        <div className="mt-2 flex justify-end">
          <Link
            href="/board"
            className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Im Board ansehen →
          </Link>
        </div>
      )}
    </div>
  );
}
