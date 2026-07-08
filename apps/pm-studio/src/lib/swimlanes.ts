import type { BoardTask, Person, PlannedSprint, Tag } from "@/types";

/**
 * Gruppierungsdimension der Board-Swimlanes (TASK-036). `none` = heutige flache
 * Ansicht (eine Spaltenreihe); die übrigen Modi gruppieren die Tasks in
 * horizontale Lanes, in denen die Spalten je Gruppe wiederholt werden.
 */
export type SwimlaneMode = "none" | "assignee" | "sprint" | "tag";

/** Auswahloptionen für den „Gruppieren nach"-Umschalter (eine Quelle). */
export const SWIMLANE_MODES: { value: SwimlaneMode; label: string }[] = [
  { value: "none", label: "Keine" },
  { value: "assignee", label: "Zuständig" },
  { value: "sprint", label: "Sprint" },
  { value: "tag", label: "Tag" },
];

/** Sentinel-Lane-Id für Tasks ohne Wert in der aktiven Dimension. */
export const UNGROUPED_LANE = "__ungrouped__";

/** Eine Swimlane: Gruppen-Id, Label und die zugehörigen Tasks. */
export type Swimlane = {
  id: string;
  label: string;
  tasks: BoardTask[];
};

/** Referenzdaten zum Auflösen der Lane-Labels/-Reihenfolge. */
export type SwimlaneRefs = {
  persons: Pick<Person, "id" | "name">[];
  sprints: Pick<PlannedSprint, "id" | "name" | "storyIds">[];
  tags: Pick<Tag, "id" | "name">[];
};

/** Label der „ohne Zuordnung"-Lane je Dimension. */
function ungroupedLabel(mode: SwimlaneMode): string {
  switch (mode) {
    case "assignee":
      return "Nicht zugewiesen";
    case "sprint":
      return "Ohne Sprint";
    case "tag":
      return "Ohne Tag";
    default:
      return "Alle Tasks";
  }
}

/** Map jeder Story-Id auf ihren Sprint (eine Story gehört zu ≤ 1 Sprint). */
function sprintByStory(
  sprints: Pick<PlannedSprint, "id" | "storyIds">[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const sprint of sprints)
    for (const storyId of sprint.storyIds) map.set(storyId, sprint.id);
  return map;
}

/**
 * Lane-Schlüssel eines Tasks in der gewählten Dimension. Tag-Lanes gruppieren
 * bewusst nach dem **ersten** Tag (`tagIds[0]`), damit jeder Task in genau einer
 * Lane liegt (eindeutige dnd-Ids; siehe testkonzept.md).
 */
function laneKey(
  task: BoardTask,
  mode: SwimlaneMode,
  sprintOf: Map<string, string>,
): string {
  switch (mode) {
    case "assignee":
      return task.assigneeId ?? UNGROUPED_LANE;
    case "sprint":
      return (task.storyId ? sprintOf.get(task.storyId) : undefined) ?? UNGROUPED_LANE;
    case "tag":
      return task.tagIds?.[0] ?? UNGROUPED_LANE;
    default:
      return UNGROUPED_LANE;
  }
}

/**
 * Gruppiert die (bereits gefilterten) Tasks in Swimlanes (TASK-036). Reihenfolge
 * der Lanes folgt der Store-Reihenfolge der Referenz-Entität (Personen/Sprints/
 * Tags); die „ohne Zuordnung"-Lane steht immer zuletzt. Es werden nur Lanes mit
 * mindestens einem Task ausgegeben (keine leeren Lanes für ungenutzte Entitäten).
 * Bei `mode === "none"` entsteht eine einzige Lane mit allen Tasks.
 */
export function buildSwimlanes(
  tasks: BoardTask[],
  mode: SwimlaneMode,
  refs: SwimlaneRefs,
): Swimlane[] {
  if (mode === "none") {
    return [{ id: UNGROUPED_LANE, label: ungroupedLabel(mode), tasks }];
  }

  const sprintOf = sprintByStory(refs.sprints);
  const grouped = new Map<string, BoardTask[]>();
  for (const task of tasks) {
    const key = laneKey(task, mode, sprintOf);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(task);
    else grouped.set(key, [task]);
  }

  const orderedRefs =
    mode === "assignee"
      ? refs.persons
      : mode === "sprint"
        ? refs.sprints
        : refs.tags;

  const lanes: Swimlane[] = [];
  for (const ref of orderedRefs) {
    const laneTasks = grouped.get(ref.id);
    if (laneTasks?.length) lanes.push({ id: ref.id, label: ref.name, tasks: laneTasks });
  }

  const ungrouped = grouped.get(UNGROUPED_LANE);
  if (ungrouped?.length)
    lanes.push({ id: UNGROUPED_LANE, label: ungroupedLabel(mode), tasks: ungrouped });

  return lanes;
}

/**
 * Anweisung, wie eine Lane-übergreifende Verschiebung die Gruppen-Zuordnung
 * ändert (TASK-036). Die Seite interpretiert sie:
 * - `assignee` → `updateTask(id, { assigneeId })` (undefined = nicht zugewiesen)
 * - `sprint`   → `assignStory(storyId, sprintId)` **nur** wenn der Task eine
 *   `storyId` hat (Sprint-Zugehörigkeit liegt auf Story-Ebene); sonst no-op.
 * - `none`     → nur die Spalte ändert sich. Genutzt im Tag-Modus: Tag-Mitglied-
 *   schaft (Mehrfach-Tags) wird im Task-Dialog gepflegt, nicht per Drag.
 */
export type LaneReassignment =
  | { kind: "assignee"; assigneeId: string | undefined }
  | { kind: "sprint"; sprintId: string | null }
  | { kind: "none" };

/** Reine Ableitung der Lane-übergreifenden Gruppen-Neuzuordnung (testbar). */
export function laneReassignment(
  mode: SwimlaneMode,
  targetLaneId: string,
): LaneReassignment {
  const isUngrouped = targetLaneId === UNGROUPED_LANE;
  switch (mode) {
    case "assignee":
      return { kind: "assignee", assigneeId: isUngrouped ? undefined : targetLaneId };
    case "sprint":
      return { kind: "sprint", sprintId: isUngrouped ? null : targetLaneId };
    default:
      return { kind: "none" };
  }
}
