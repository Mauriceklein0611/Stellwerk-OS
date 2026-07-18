import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  buildKeyBackfill,
  derivePrefix,
  formatItemKey,
  type BackfillInput,
  type KeyState,
} from "@/lib/item-key";

/**
 * Read the persisted stores straight from localStorage (like the backlog store's
 * artifact migration) so the one-time key backfill is independent of hydration
 * order and needs no cross-store import (this store stays a leaf). Returns empty
 * lists on SSR or malformed data.
 */
function readBackfillInput(): BackfillInput {
  if (typeof localStorage === "undefined")
    return { projects: [], stories: [], tasks: [] };
  const read = <T>(name: string, pick: (state: Record<string, unknown>) => T): T => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return pick({});
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
      return pick(parsed.state ?? {});
    } catch {
      return pick({});
    }
  };

  const projects = read("pm-studio-projects", (state) =>
    (Array.isArray(state.ideas) ? state.ideas : []).map((idea) => {
      const i = idea as { id?: string; name?: string };
      return { id: String(i.id ?? ""), name: String(i.name ?? "") };
    }),
  ).filter((p) => p.id);

  const stories = read("pm-studio-backlog", (state) =>
    (Array.isArray(state.stories) ? state.stories : []).map((story) => {
      const s = story as { id?: string; projectId?: string; rank?: number };
      return {
        id: String(s.id ?? ""),
        projectId: String(s.projectId ?? ""),
        rank: typeof s.rank === "number" ? s.rank : 0,
      };
    }),
  ).filter((s) => s.id && s.projectId);

  const tasks = read("pm-studio-board", (state) =>
    (Array.isArray(state.tasks) ? state.tasks : []).map((task) => {
      const t = task as {
        id?: string;
        projectId?: string;
        column?: string;
        order?: number;
      };
      return {
        id: String(t.id ?? ""),
        projectId: String(t.projectId ?? ""),
        column: String(t.column ?? ""),
        order: typeof t.order === "number" ? t.order : 0,
      };
    }),
  ).filter((t) => t.id && t.projectId);

  return { projects, stories, tasks };
}

type ItemKeyState = KeyState & {
  /** One-time flag: pre-existing stories/tasks were already backfilled. */
  backfilled: boolean;
  /**
   * Ensure a project has a key prefix (TASK-064). Called on idea creation so a
   * prefix exists before any of the project's items get a key. Idempotent.
   */
  registerProject: (projectId: string, name: string) => void;
  /**
   * Allocate (or return the existing) readable key for a story/board task. Called
   * from the item's create action. Idempotent per item id; the per-project
   * counter only counts up so keys are never reused. Registers a prefix lazily if
   * the project has none yet (should not happen once `registerProject` ran).
   */
  assignKey: (itemId: string, projectId: string, projectName?: string) => string;
  /** One-time backfill for items/projects that predate the feature. No-op if done. */
  runBackfill: () => void;
};

/**
 * Owns human-readable item keys (TASK-064) – per-project prefix + running counter
 * and the id → key map. A deliberate **leaf** store (imports no other store) so
 * the project/backlog/board stores can call it from their create actions without
 * widening the store-init cycle (same pattern as `useActivityStore`). Keys are
 * kept in a central map instead of on each entity, which avoids a migration on
 * the backlog/board persist shapes and keeps keys stable across delete/undo.
 */
export const useItemKeyStore = create<ItemKeyState>()(
  persist(
    (set, get) => ({
      prefixes: {},
      counters: {},
      keys: {},
      backfilled: false,

      registerProject: (projectId, name) => {
        const { prefixes } = get();
        if (prefixes[projectId]) return;
        const prefix = derivePrefix(name, new Set(Object.values(prefixes)));
        set({ prefixes: { ...prefixes, [projectId]: prefix } });
      },

      assignKey: (itemId, projectId, projectName) => {
        const { keys, prefixes, counters } = get();
        const existing = keys[itemId];
        if (existing) return existing;

        const nextPrefixes = { ...prefixes };
        let prefix = prefixes[projectId];
        if (!prefix) {
          prefix = derivePrefix(
            projectName ?? projectId,
            new Set(Object.values(prefixes)),
          );
          nextPrefixes[projectId] = prefix;
        }
        const n = (counters[projectId] ?? 0) + 1;
        const key = formatItemKey(prefix, n);
        set({
          prefixes: nextPrefixes,
          counters: { ...counters, [projectId]: n },
          keys: { ...keys, [itemId]: key },
        });
        return key;
      },

      runBackfill: () => {
        if (get().backfilled) return;
        const { prefixes, counters, keys } = get();
        const next = buildKeyBackfill(readBackfillInput(), {
          prefixes,
          counters,
          keys,
        });
        set({ ...next, backfilled: true });
      },
    }),
    {
      name: "pm-studio-item-keys",
      version: 1,
      partialize: (state) => ({
        prefixes: state.prefixes,
        counters: state.counters,
        keys: state.keys,
        backfilled: state.backfilled,
      }),
      // One-time backfill, read directly from the persisted stores (no import
      // cycle, hydration-order independent). Deferred to a microtask so it runs
      // after this store finished hydrating.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const run = () => useItemKeyStore.getState().runBackfill();
        if (typeof queueMicrotask === "function") queueMicrotask(run);
        else void Promise.resolve().then(run);
      },
    },
  ),
);
