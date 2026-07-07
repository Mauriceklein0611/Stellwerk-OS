import type {
  BoardColumn,
  BoardColumnDef,
  BoardTask,
  Metric,
  Project,
  ProjectArtifacts,
  ProjectIdea,
  RiskEntry,
  StatusType,
  TaskStatusSlice,
  Trend,
  UserStory,
  VelocityPoint,
} from "@/types";
import { DEFAULT_BOARD_COLUMNS, DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { isStoryDone } from "@/lib/sprint-progress";

/**
 * Pure selectors that derive the dashboard view models from the local stores
 * (useProjectStore / useBoardStore / useAgentStore). Kept free of React/Zustand
 * so they are trivially unit-testable and reusable. The real backend (M6+) only
 * swaps the data behind getAgentService() – these selectors stay unchanged.
 */

/** Real store data has no historical trend yet → neutral, non-status trend. */
const FLAT_TREND: Trend = { value: "—", direction: "flat" };

function totalSprints(artifacts: ProjectArtifacts[]): number {
  return artifacts.reduce(
    (sum, a) => sum + a.backlog.sprint_suggestions.length,
    0,
  );
}

/** The four metric cards, derived from real entities. Story count comes from the
 * backlog store (TASK-056), risks from the risk store (TASK-061); sprint
 * suggestions still from the artifacts. */
export function selectMetrics(
  ideas: ProjectIdea[],
  artifactsMap: Record<string, ProjectArtifacts>,
  stories: UserStory[],
  risks: RiskEntry[],
): Metric[] {
  const artifacts = Object.values(artifactsMap);
  return [
    {
      id: "active-projects",
      label: "Aktive Projekte",
      value: ideas.length,
      trend: FLAT_TREND,
      series: [],
    },
    {
      id: "planned-sprints",
      label: "Sprints (geplant)",
      value: totalSprints(artifacts),
      trend: FLAT_TREND,
      series: [],
    },
    {
      id: "open-tasks",
      label: "Offene Aufgaben",
      value: stories.length,
      trend: FLAT_TREND,
      series: [],
    },
    {
      id: "open-risks",
      label: "Offene Risiken",
      value: risks.length,
      trend: FLAT_TREND,
      series: [],
    },
  ];
}

function projectStatus(progress: number): StatusType {
  if (progress >= 100) return "success";
  if (progress > 0) return "running";
  return "idle";
}

/**
 * One progress row per project (idea). Progress is the share of its board tasks
 * in a terminal phase (≙ "done", TASK-032b); projects without board tasks sit at
 * 0 %. `terminalColumns` defaults to the standard terminal id (`done`).
 */
export function selectProjects(
  ideas: ProjectIdea[],
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): Project[] {
  return ideas.map((idea) => {
    const tasks = boardTasks.filter((task) => task.projectId === idea.id);
    const done = tasks.filter((task) => terminalColumns.has(task.column)).length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return {
      id: idea.id,
      name: idea.name,
      progress,
      status: projectStatus(progress),
    };
  });
}

/**
 * Status token → donut slice label + sort order. Board tasks are collapsed by
 * the status accent of their phase (TASK-032b), so configurable phases land in
 * the right slice instead of crashing on an unknown column id.
 */
const STATUS_BUCKET: Record<StatusType, { label: string; order: number }> = {
  idle: { label: "Offen", order: 0 },
  running: { label: "In Arbeit", order: 1 },
  info: { label: "Review/Test", order: 2 },
  warning: { label: "Warnung", order: 3 },
  danger: { label: "Kritisch", order: 4 },
  success: { label: "Erledigt", order: 5 },
};

/**
 * Distribution of board tasks by status for the donut (empty if no tasks).
 * Buckets each task by the status accent of its phase; `columns` defaults to the
 * standard phases so existing callers/tests stay valid.
 */
export function selectTaskStatusDistribution(
  boardTasks: BoardTask[],
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): TaskStatusSlice[] {
  const statusOf = new Map(columns.map((column) => [column.id, column.status]));
  const buckets = new Map<
    StatusType,
    { label: string; order: number; count: number }
  >();

  for (const task of boardTasks) {
    const status = statusOf.get(task.column) ?? "idle";
    const bucket = STATUS_BUCKET[status];
    const current = buckets.get(status);
    if (current) current.count += 1;
    else
      buckets.set(status, {
        label: bucket.label,
        order: bucket.order,
        count: 1,
      });
  }

  return [...buckets.entries()]
    .map(([status, value]) => ({ status, ...value }))
    .sort((a, b) => a.order - b.order)
    .map(({ status, label, count }) => ({ status, label, count }));
}

/**
 * Velocity per suggested sprint: completed vs. planned person-days. A story
 * counts as completed only when all of its board tasks are terminal (TASK-038,
 * see {@link isStoryDone}); planned is the sum of all assigned estimates.
 * `terminalColumns` defaults to the standard terminal id (`done`).
 */
export function selectVelocity(
  artifactsMap: Record<string, ProjectArtifacts>,
  stories: UserStory[],
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): VelocityPoint[] {
  const points: VelocityPoint[] = [];

  // Story estimates come from the backlog store (TASK-056); the suggested
  // sprints (and their story ids) still live on the run artifact.
  const storyPoints = new Map<string, number>();
  for (const story of stories) storyPoints.set(story.id, story.estimate_pt);

  for (const artifacts of Object.values(artifactsMap)) {
    for (const sprint of artifacts.backlog.sprint_suggestions) {
      let planned = 0;
      let done = 0;
      for (const id of new Set(sprint.story_ids)) {
        const pt = storyPoints.get(id) ?? 0;
        planned += pt;
        if (isStoryDone(id, boardTasks, terminalColumns)) done += pt;
      }
      points.push({ sprint: sprint.name, points: done, planned });
    }
  }

  return points;
}
