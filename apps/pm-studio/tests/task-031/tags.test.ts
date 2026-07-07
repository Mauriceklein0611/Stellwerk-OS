import { describe, expect, it } from "vitest";

import {
  TAG_COLORS,
  TAG_COLOR_STYLES,
  detachTaskTags,
  tagColorStyle,
  tagsForIds,
  taskHasTag,
} from "@/lib/tags";
import type { BoardTask, Tag } from "@/types";

const tags: Tag[] = [
  { id: "tag-fe", name: "Frontend", color: "primary" },
  { id: "tag-bug", name: "Bug", color: "danger" },
  { id: "tag-debt", name: "Tech-Debt", color: "warning" },
];

const base: Omit<BoardTask, "id" | "tagIds"> = {
  title: "Task",
  column: "todo",
  order: 0,
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

describe("TAG_COLOR_STYLES / palette", () => {
  it("lists every palette color and only token-based classes (no ad-hoc hex)", () => {
    expect(TAG_COLORS).toEqual([
      "primary",
      "accent",
      "info",
      "success",
      "warning",
      "danger",
    ]);
    for (const color of TAG_COLORS) {
      const style = TAG_COLOR_STYLES[color];
      expect(style.chip).toContain(`text-${color}`);
      expect(style.swatch).toBe(`bg-${color}`);
      expect(style.chip).not.toMatch(/#/);
    }
  });

  it("tagColorStyle falls back to primary for an unknown color", () => {
    // @ts-expect-error – deliberately invalid color at runtime
    expect(tagColorStyle("chartreuse")).toBe(TAG_COLOR_STYLES.primary);
  });
});

describe("tagsForIds", () => {
  it("resolves ids in tag-store order and ignores unknown ids", () => {
    expect(tagsForIds(["tag-bug", "tag-fe", "ghost"], tags)).toEqual([
      tags[0], // Frontend (store order, not id order)
      tags[1], // Bug
    ]);
  });

  it("returns an empty array for missing/empty ids", () => {
    expect(tagsForIds(undefined, tags)).toEqual([]);
    expect(tagsForIds([], tags)).toEqual([]);
  });
});

describe("taskHasTag", () => {
  it("detects membership", () => {
    expect(taskHasTag({ tagIds: ["tag-fe"] }, "tag-fe")).toBe(true);
    expect(taskHasTag({ tagIds: ["tag-fe"] }, "tag-bug")).toBe(false);
    expect(taskHasTag({ tagIds: undefined }, "tag-fe")).toBe(false);
  });
});

describe("detachTaskTags", () => {
  const tasks: BoardTask[] = [
    { id: "t1", tagIds: ["tag-fe", "tag-bug"], ...base },
    { id: "t2", tagIds: ["tag-bug"], ...base },
    { id: "t3", tagIds: ["tag-fe"], ...base },
    { id: "t4", ...base }, // no tags
  ];

  it("removes the tag from every task and keeps the remaining tags", () => {
    const result = detachTaskTags(tasks, "tag-bug");

    expect(result.find((t) => t.id === "t1")?.tagIds).toEqual(["tag-fe"]);
    // An emptied tagIds is dropped entirely (no empty array left behind).
    expect(result.find((t) => t.id === "t2")?.tagIds).toBeUndefined();
    expect(result.find((t) => t.id === "t3")?.tagIds).toEqual(["tag-fe"]);
    expect(result).toHaveLength(tasks.length);
  });

  it("returns an equivalent list when no task carries the tag", () => {
    expect(detachTaskTags(tasks, "ghost")).toEqual(tasks);
  });
});
