/**
 * Human-readable, per-project item keys (TASK-064): a running number with a
 * project prefix, e.g. `PMS-42`. The UUID stays the primary key; the item key is
 * a stable display/reference handle for communication, search and (later) agent
 * references. Pure and unit-testable – the owning {@link useItemKeyStore} only
 * persists the derived state and calls these helpers.
 *
 * Stories and board tasks of one project share a single running sequence
 * (Jira-like: PMS-1 may be a story, PMS-2 a task). Keys are never reused – the
 * per-project counter only counts up, even after an item (or the project) is
 * deleted, so keys stay stable across delete/undo.
 */

/** Persisted key state: per-project prefix + counter, and the id → key map. */
export type KeyState = {
  /** Project id → key prefix (e.g. "PMS"). */
  prefixes: Record<string, string>;
  /** Project id → last handed-out number (only ever increases). */
  counters: Record<string, number>;
  /** Item id (story or task) → its readable key. Never removed (undo-stable). */
  keys: Record<string, string>;
};

/** `${prefix}-${n}`, e.g. `formatItemKey("PMS", 42)` → "PMS-42". */
export function formatItemKey(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

/**
 * A prefix candidate from a project name, before collision handling: strip
 * accents, keep A–Z, then take the initials of the first up to three words (for
 * multi-word names) or the first three letters (single word). Falls back to
 * "PRJ" when the name yields fewer than two usable letters.
 */
function basePrefix(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
  const words = ascii.split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return "PRJ";

  let letters =
    words.length >= 2
      ? words.slice(0, 3).map((word) => word[0]).join("")
      : words[0].slice(0, 3);
  letters = letters.replace(/[^A-Z]/g, "");
  if (letters.length < 2) {
    // Not enough word-initials (e.g. a numeric-heavy name) – fall back to the
    // first letters found anywhere in the name.
    letters = ascii.replace(/[^A-Z]/g, "").slice(0, 3);
  }
  return letters.length >= 2 ? letters : "PRJ";
}

/**
 * Derive a project key prefix from its name, resolving collisions deterministically
 * by appending a numeric suffix (`APS`, then `APS2`, `APS3`, …). `taken` holds the
 * prefixes already in use so two projects never share one.
 */
export function derivePrefix(name: string, taken: Set<string> = new Set()): string {
  const base = basePrefix(name);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

/** Minimal shapes the backfill needs from the persisted stores. */
export type BackfillInput = {
  projects: { id: string; name: string }[];
  stories: { id: string; projectId: string; rank: number }[];
  tasks: { id: string; projectId: string; column: string; order: number }[];
};

/**
 * One-time backfill (TASK-064): assign keys to every pre-existing story/task and
 * register a prefix for every project, continuing from the current {@link KeyState}.
 * Pure & idempotent – already-registered prefixes and already-keyed items are kept
 * untouched, so a re-run is a no-op. Within a project, keys are handed out in a
 * stable creation-order approximation: stories (by rank) first, then tasks (by
 * column, then order); ids break ties so the result is fully deterministic.
 */
export function buildKeyBackfill(input: BackfillInput, existing: KeyState): KeyState {
  const prefixes = { ...existing.prefixes };
  const counters = { ...existing.counters };
  const keys = { ...existing.keys };
  const taken = new Set(Object.values(prefixes));

  const ensurePrefix = (projectId: string, name: string) => {
    if (prefixes[projectId]) return;
    const prefix = derivePrefix(name, taken);
    prefixes[projectId] = prefix;
    taken.add(prefix);
  };

  // 1. Every known project gets a prefix (collision-resolved, name-order stable).
  for (const project of input.projects) ensurePrefix(project.id, project.name);

  // 2. Group items per project in creation-order approximation.
  const byProject = new Map<string, { id: string; projectId: string }[]>();
  const push = (item: { id: string; projectId: string }) => {
    const list = byProject.get(item.projectId) ?? [];
    list.push(item);
    byProject.set(item.projectId, list);
  };
  [...input.stories]
    .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id))
    .forEach(push);
  [...input.tasks]
    .sort(
      (a, b) =>
        a.column.localeCompare(b.column) ||
        a.order - b.order ||
        a.id.localeCompare(b.id),
    )
    .forEach(push);

  // 3. Hand out keys, continuing each project's counter.
  for (const [projectId, items] of byProject) {
    // A project with items but no idea entry (edge) still needs a prefix.
    ensurePrefix(projectId, projectId);
    for (const item of items) {
      if (keys[item.id]) continue;
      const n = (counters[projectId] ?? 0) + 1;
      keys[item.id] = formatItemKey(prefixes[projectId], n);
      counters[projectId] = n;
    }
  }

  return { prefixes, counters, keys };
}
