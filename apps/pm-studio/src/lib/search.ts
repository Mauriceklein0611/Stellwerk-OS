import type {
  BoardTask,
  Person,
  ProjectIdea,
  Release,
  UserStory,
} from "@/types";

/**
 * Index-free global search across the local stores (TASK-042). The CommandBar
 * was navigation-only; this turns it into a search/jump tool over every entity.
 * Pure and unit-testable – the bar only maps results to navigation targets.
 */

export type SearchResultKind =
  | "project"
  | "task"
  | "story"
  | "person"
  | "release";

export type SearchResult = {
  /** Stable React key – kind-namespaced because ids can repeat across kinds. */
  key: string;
  kind: SearchResultKind;
  /** Primary label shown in the result row. */
  label: string;
  /** Optional secondary context (e.g. the project a task/story belongs to). */
  sublabel?: string;
  /** Readable item key (TASK-064, e.g. `PMS-42`) for task/story results. */
  badge?: string;
  /** Navigation target for the result. */
  href: string;
};

export type SearchSources = {
  ideas: ProjectIdea[];
  tasks: BoardTask[];
  /** Backlog store stories (TASK-056); each carries its own `projectId`. */
  stories: UserStory[];
  persons: Person[];
  releases: Release[];
  /** Item id → readable key (TASK-064); enables searching tasks/stories by key. */
  keys?: Record<string, string>;
};

/** Default cap per entity kind so the palette stays readable. */
const DEFAULT_LIMIT = 5;

function matches(haystack: string | undefined, needle: string): boolean {
  return !!haystack && haystack.toLowerCase().includes(needle);
}

/**
 * Search projects, tasks, stories, people and releases by a case-insensitive
 * substring match on their human-facing field(s). Results are ordered by kind
 * and capped per kind; an empty query yields no results (the palette then shows
 * navigation/actions instead).
 */
export function searchEntities(
  query: string,
  sources: SearchSources,
  limitPerKind: number = DEFAULT_LIMIT,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { ideas, tasks, stories, persons, releases, keys = {} } = sources;
  const projectNameById = new Map(ideas.map((idea) => [idea.id, idea.name]));

  const projects: SearchResult[] = ideas
    .filter((idea) => matches(idea.name, q))
    .slice(0, limitPerKind)
    .map((idea) => ({
      key: `project-${idea.id}`,
      kind: "project",
      label: idea.name,
      href: `/projects/${idea.id}`,
    }));

  const taskResults: SearchResult[] = tasks
    .filter((task) => matches(task.title, q) || matches(keys[task.id], q))
    .slice(0, limitPerKind)
    .map((task) => ({
      key: `task-${task.id}`,
      kind: "task",
      label: task.title,
      sublabel: task.projectName,
      badge: keys[task.id],
      href: "/board",
    }));

  const storyResults: SearchResult[] = stories
    .filter((story) => matches(story.title, q) || matches(keys[story.id], q))
    .slice(0, limitPerKind)
    .map((story) => ({
      key: `story-${story.id}`,
      kind: "story",
      label: story.title,
      sublabel: projectNameById.get(story.projectId) ?? "Projekt",
      badge: keys[story.id],
      href: `/projects/${story.projectId}`,
    }));

  const personResults: SearchResult[] = persons
    .filter((person) => matches(person.name, q) || matches(person.role, q))
    .slice(0, limitPerKind)
    .map((person) => ({
      key: `person-${person.id}`,
      kind: "person",
      label: person.name,
      sublabel: person.role,
      href: "/team",
    }));

  const releaseResults: SearchResult[] = releases
    .filter((release) => matches(release.name, q))
    .slice(0, limitPerKind)
    .map((release) => ({
      key: `release-${release.id}`,
      kind: "release",
      label: release.name,
      href: "/releases",
    }));

  const results = [
    ...projects,
    ...taskResults,
    ...storyResults,
    ...personResults,
    ...releaseResults,
  ];

  // An exact item-key match ranks first (TASK-064): typing "PMS-42" jumps straight
  // to that item. Otherwise the kind order above is preserved (stable partition).
  const exact = results.filter((result) => result.badge?.toLowerCase() === q);
  if (exact.length === 0) return results;
  const rest = results.filter((result) => result.badge?.toLowerCase() !== q);
  return [...exact, ...rest];
}
