import type { BoardTask, Tag, TagColor } from "@/types";

/**
 * Tag colors as a fixed palette built from the design tokens (TASK-031). Each
 * entry maps to literal Tailwind classes so no component invents an ad-hoc
 * color: `chip` styles the label pill (token `/10` background + token text,
 * same recipe as <StatusBadge>), `swatch` is the solid dot for the picker.
 * Class strings stay literal so Tailwind detects them.
 */
export const TAG_COLOR_STYLES: Record<
  TagColor,
  { chip: string; swatch: string; label: string }
> = {
  primary: { chip: "bg-primary/10 text-primary", swatch: "bg-primary", label: "Indigo" },
  accent: { chip: "bg-accent/10 text-accent", swatch: "bg-accent", label: "Cyan" },
  info: { chip: "bg-info/10 text-info", swatch: "bg-info", label: "Blau" },
  success: { chip: "bg-success/10 text-success", swatch: "bg-success", label: "Grün" },
  warning: { chip: "bg-warning/10 text-warning", swatch: "bg-warning", label: "Gelb" },
  danger: { chip: "bg-danger/10 text-danger", swatch: "bg-danger", label: "Rot" },
};

/** Selectable palette in stable order (picker, default color). */
export const TAG_COLORS = Object.keys(TAG_COLOR_STYLES) as TagColor[];

/** Style for a tag color, falling back to the first palette entry. */
export function tagColorStyle(color: TagColor) {
  return TAG_COLOR_STYLES[color] ?? TAG_COLOR_STYLES.primary;
}

/**
 * Resolve a task's tag ids into Tag objects, in the tag store's order (stable,
 * deduplicated) and ignoring ids whose tag no longer exists. Pure.
 */
export function tagsForIds(
  tagIds: string[] | undefined,
  tags: Tag[],
): Tag[] {
  if (!tagIds?.length) return [];
  const ids = new Set(tagIds);
  return tags.filter((tag) => ids.has(tag.id));
}

/** Does a task carry the given tag? */
export function taskHasTag(task: Pick<BoardTask, "tagIds">, tagId: string): boolean {
  return !!task.tagIds?.includes(tagId);
}

/**
 * Decouple a (deleted) tag from all board tasks: drop its id from every task's
 * `tagIds` so nothing references a tag that no longer exists (TASK-031, analog
 * to Team→Person in TASK-019). Returns a new array; tasks that didn't carry the
 * tag are returned unchanged. An emptied `tagIds` is removed entirely.
 */
export function detachTaskTags(tasks: BoardTask[], tagId: string): BoardTask[] {
  return tasks.map((task) => {
    if (!task.tagIds?.includes(tagId)) return task;
    const remaining = task.tagIds.filter((id) => id !== tagId);
    const next = { ...task };
    if (remaining.length) next.tagIds = remaining;
    else delete next.tagIds;
    return next;
  });
}
