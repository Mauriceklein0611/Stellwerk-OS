import type { BoardTask } from "@/types";

/**
 * Decouple a (deleted) person from all board tasks: drop their id from every
 * task's `assigneeId` so nothing references an assignee that no longer exists
 * (TASK-040, analog to tag detach in TASK-031 and Team→Person in TASK-019).
 * Returns a new array; tasks not assigned to the person are returned unchanged.
 */
export function detachAssignee(
  tasks: BoardTask[],
  personId: string,
): BoardTask[] {
  return tasks.map((task) => {
    if (task.assigneeId !== personId) return task;
    const next = { ...task };
    delete next.assigneeId;
    return next;
  });
}
