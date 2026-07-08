import { describe, expect, it } from "vitest";

import {
  detachStoryTasks,
  storyTaskRollup,
  tasksForStory,
} from "@/lib/story-tasks";
import type { BoardTask } from "@/types";

const base: Omit<BoardTask, "id" | "column" | "order" | "storyId"> = {
  title: "Task",
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

const tasks: BoardTask[] = [
  { id: "t1", column: "done", order: 0, storyId: "US-1", estimate_pt: 3, ...base },
  { id: "t2", column: "todo", order: 1, storyId: "US-1", estimate_pt: 2, ...base },
  { id: "t3", column: "in_progress", order: 0, storyId: "US-1", ...base },
  { id: "t4", column: "todo", order: 0, storyId: "US-2", estimate_pt: 5, ...base },
  { id: "t5", column: "backlog", order: 0, ...base }, // no story link
];

describe("tasksForStory", () => {
  it("selects only a story's tasks, ordered by column then position", () => {
    expect(tasksForStory("US-1", tasks).map((t) => t.id)).toEqual([
      "t2", // todo
      "t3", // in_progress
      "t1", // done
    ]);
  });

  it("returns an empty array for a story without tasks", () => {
    expect(tasksForStory("US-9", tasks)).toEqual([]);
  });
});

describe("storyTaskRollup", () => {
  it("aggregates counts and PT sums, treating missing estimates as 0", () => {
    expect(storyTaskRollup("US-1", tasks)).toEqual({
      total: 3,
      doneTasks: 1,
      totalPt: 5, // 3 + 2 + 0
      donePt: 3,
      storyDone: false, // only 1 of 3 tasks terminal → not done (TASK-038)
    });
  });

  it("reports storyDone=false while no task is done", () => {
    const rollup = storyTaskRollup("US-2", tasks);
    expect(rollup).toMatchObject({ total: 1, doneTasks: 0, donePt: 0, storyDone: false });
  });

  it("is empty for an unknown story", () => {
    expect(storyTaskRollup("US-9", tasks)).toEqual({
      total: 0,
      doneTasks: 0,
      totalPt: 0,
      donePt: 0,
      storyDone: false,
    });
  });
});

describe("detachStoryTasks", () => {
  it("drops the storyId of the matching tasks and leaves the rest untouched", () => {
    const result = detachStoryTasks(tasks, "US-1");

    expect(result.filter((t) => t.storyId === "US-1")).toHaveLength(0);
    // Other stories and unlinked tasks keep their state.
    expect(result.find((t) => t.id === "t4")?.storyId).toBe("US-2");
    expect(result.find((t) => t.id === "t5")?.storyId).toBeUndefined();
    // Detached tasks still exist (no orphaning), just without the link.
    expect(result).toHaveLength(tasks.length);
    expect(result.find((t) => t.id === "t1")).toMatchObject({ title: "Task" });
  });

  it("returns an equivalent list when no task references the story", () => {
    expect(detachStoryTasks(tasks, "US-9")).toEqual(tasks);
  });
});
