import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useBoardStore } from "@/store/useBoardStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { logActivity } from "@/store/useActivityStore";
import { flattenBacklog, moveRanked } from "@/lib/backlog";
import type {
  Backlog,
  BacklogProvenance,
  Epic,
  ProjectArtifacts,
  UserStory,
} from "@/types";

/**
 * Shape of a persisted story before TASK-058, when `acceptance_criteria` was a
 * plain `string[]`. Used only by the v1→v2 migration to lift them to checkable
 * {@link AcceptanceCriterion}[].
 */
type LegacyUserStory = Omit<UserStory, "acceptance_criteria"> & {
  acceptance_criteria: string[];
};

/**
 * Read the legacy artifact backlogs straight from the persisted project store
 * (`pm-studio-projects`) in localStorage. Reading storage directly (instead of
 * importing `useProjectStore`) avoids a store-init import cycle and is immune to
 * hydration order. Returns {} on SSR or malformed/missing data.
 */
function readPersistedArtifacts(): Record<string, ProjectArtifacts> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem("pm-studio-projects");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      state?: { artifacts?: Record<string, ProjectArtifacts> };
    };
    return parsed.state?.artifacts ?? {};
  } catch {
    return {};
  }
}

/**
 * Decouple a (deleted) story's board tasks so they never dangle against a story
 * that no longer exists (TASK-037/056). Called outside the `set` updater so the
 * updater stays pure and there is no store-init cycle (TASK-043 pattern).
 */
function detachStoryTasks(storyIds: string[]): void {
  const { detachStory } = useBoardStore.getState();
  storyIds.forEach((id) => detachStory(id));
}

/** Shape of the persisted backlog slice (any version). */
type PersistedBacklog = {
  epics: Epic[];
  stories: (UserStory | LegacyUserStory)[];
  artifactsMigrated: boolean;
};

/**
 * Persist migration (TASK-058): lift each story's `acceptance_criteria` from a
 * plain `string[]` (v1) to checkable `AcceptanceCriterion[]` (v2). Additive &
 * lossless – every legacy string becomes an open criterion; already-lifted
 * entries pass through untouched. A version bump without this migrate would drop
 * the whole persisted backlog, so it is mandatory. Exported for unit tests.
 */
export function migrateBacklogPersistedState(
  persisted: unknown,
  version: number,
): PersistedBacklog {
  const state = persisted as PersistedBacklog;
  if (version >= 2) return state;
  return {
    ...state,
    stories: state.stories.map((story) => ({
      ...story,
      acceptance_criteria: Array.isArray(story.acceptance_criteria)
        ? story.acceptance_criteria.map((ac) =>
            typeof ac === "string"
              ? { id: crypto.randomUUID(), text: ac, done: false }
              : ac,
          )
        : [],
    })),
  };
}

type BacklogState = {
  epics: Epic[];
  stories: UserStory[];
  /**
   * One-time flag: the legacy artifact backlogs (`artifacts[*].backlog`) were
   * already promoted into this store. Prevents re-importing them on every hydrate
   * (which would resurrect deleted items).
   */
  artifactsMigrated: boolean;

  addEpic: (epic: Epic) => void;
  updateEpic: (id: string, patch: Partial<Omit<Epic, "id" | "projectId">>) => void;
  /** Remove an epic and cascade-delete its stories (their board tasks detach). */
  removeEpic: (id: string) => void;

  addStory: (story: UserStory) => void;
  updateStory: (
    id: string,
    patch: Partial<Omit<UserStory, "id" | "projectId" | "epicId">>,
  ) => void;
  /** Remove a story; its board tasks keep living (storyId detached). */
  removeStory: (id: string) => void;

  /**
   * Move a story to another epic (TASK-058, story dialog). Sets `epicId` and
   * ranks it at the end of the target epic; a no-op when already there. Bumps an
   * agent story to `human_edited` like {@link updateStory}.
   */
  moveStoryToEpic: (storyId: string, targetEpicId: string) => void;

  reorderEpic: (projectId: string, epicId: string, targetIndex: number) => void;
  reorderStory: (epicId: string, storyId: string, targetIndex: number) => void;

  /**
   * Import a Scrum-agent backlog artifact into the store (TASK-056). Adds only
   * items whose id is not present yet – it never replaces existing (possibly
   * human-edited) items, so a re-run of the pipeline is purely additive and
   * idempotent over the artifact story/epic ids.
   */
  importBacklog: (
    projectId: string,
    backlog: Backlog,
    provenance?: BacklogProvenance,
  ) => void;

  /** Remove all epics/stories of a project (cascade on project delete). */
  removeProjectItems: (projectId: string) => void;

  /**
   * Decouple a (deleted) release from every story that referenced it (TASK-062):
   * `releaseId → undefined`, so a removed release never dangles on a story. Same
   * cleanup pattern as `useTagStore.removeTag → useBoardStore.detachTag`.
   */
  detachRelease: (releaseId: string) => void;

  /** Restore the whole slice from a snapshot (TASK-040 safe-delete Undo). */
  restore: (snapshot: { epics: Epic[]; stories: UserStory[] }) => void;

  /**
   * One-time promotion of legacy artifact backlogs into the store. Pure over the
   * passed map so it is unit-testable; no-op once `artifactsMigrated` is true.
   */
  migrateFromArtifacts: (
    artifacts: Record<string, ProjectArtifacts>,
  ) => void;
};

/**
 * Backlog entities (epics & stories) as the single source of truth (TASK-056).
 * Previously epics/stories only lived nested inside the Scrum-agent artifact
 * (`ProjectArtifacts.backlog`); now they are first-class, CRUD-able and survive
 * a pipeline re-run. The artifact stays as a run snapshot but the UI reads here.
 */
export const useBacklogStore = create<BacklogState>()(
  persist(
    (set, get) => ({
      epics: [],
      stories: [],
      artifactsMigrated: false,

      addEpic: (epic) =>
        set((state) => ({ epics: [...state.epics, epic] })),
      updateEpic: (id, patch) =>
        set((state) => ({
          epics: state.epics.map((epic) =>
            epic.id === id ? { ...epic, ...patch } : epic,
          ),
        })),
      removeEpic: (id) => {
        const orphanedStoryIds = get()
          .stories.filter((story) => story.epicId === id)
          .map((story) => story.id);
        set((state) => ({
          epics: state.epics.filter((epic) => epic.id !== id),
          stories: state.stories.filter((story) => story.epicId !== id),
        }));
        detachStoryTasks(orphanedStoryIds);
      },

      addStory: (story) => {
        set((state) => ({ stories: [...state.stories, story] }));
        // Allocate the readable item key (TASK-064) outside the updater.
        useItemKeyStore.getState().assignKey(story.id, story.projectId);
        logActivity({
          entityType: "story",
          entityId: story.id,
          kind: "create",
          summary: `Story „${story.title}" angelegt`,
        });
      },
      updateStory: (id, patch) => {
        set((state) => ({
          stories: state.stories.map((story) => {
            if (story.id !== id) return story;
            // Editing an agent-generated story marks it as human-touched so the
            // suggestion inbox (TASK-060) can tell them apart. Explicit provenance
            // in the patch always wins.
            const provenance =
              patch.provenance ??
              (story.provenance === "agent" ? "human_edited" : story.provenance);
            return { ...story, ...patch, provenance };
          }),
        }));
        // Log every field edit as a single "geändert" event (TASK-058). Reorder
        // (rank) uses `reorderStory`, not this path, so pure reordering stays
        // out of the history (granularity rule, TASK-043).
        const story = get().stories.find((s) => s.id === id);
        if (story) {
          logActivity({
            entityType: "story",
            entityId: id,
            kind: "update",
            summary: `Story „${story.title}" geändert`,
          });
        }
      },
      removeStory: (id) => {
        const story = get().stories.find((s) => s.id === id);
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== id),
        }));
        if (story) {
          detachStoryTasks([id]);
          logActivity({
            entityType: "story",
            entityId: id,
            kind: "delete",
            summary: `Story „${story.title}" gelöscht`,
          });
        }
      },

      moveStoryToEpic: (storyId, targetEpicId) => {
        const story = get().stories.find((s) => s.id === storyId);
        if (!story || story.epicId === targetEpicId) return;
        const nextRank = get().stories.filter(
          (s) => s.epicId === targetEpicId,
        ).length;
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId
              ? {
                  ...s,
                  epicId: targetEpicId,
                  rank: nextRank,
                  provenance:
                    s.provenance === "agent" ? "human_edited" : s.provenance,
                }
              : s,
          ),
        }));
        logActivity({
          entityType: "story",
          entityId: storyId,
          kind: "update",
          summary: `Story „${story.title}" in anderes Epic verschoben`,
        });
      },

      reorderEpic: (projectId, epicId, targetIndex) =>
        set((state) => {
          const own = state.epics.filter((epic) => epic.projectId === projectId);
          const others = state.epics.filter(
            (epic) => epic.projectId !== projectId,
          );
          return { epics: [...others, ...moveRanked(own, epicId, targetIndex)] };
        }),
      reorderStory: (epicId, storyId, targetIndex) =>
        set((state) => {
          const own = state.stories.filter((story) => story.epicId === epicId);
          const others = state.stories.filter(
            (story) => story.epicId !== epicId,
          );
          return {
            stories: [...others, ...moveRanked(own, storyId, targetIndex)],
          };
        }),

      importBacklog: (projectId, backlog, provenance = "agent") => {
        const state = get();
        const { epics, stories } = flattenBacklog(projectId, backlog, provenance);
        const knownEpicIds = new Set(state.epics.map((epic) => epic.id));
        const knownStoryIds = new Set(state.stories.map((story) => story.id));
        const nextEpicRank = state.epics.filter(
          (epic) => epic.projectId === projectId,
        ).length;

        // Append only ids we don't already have (idempotent, never replace).
        const newEpics = epics
          .filter((epic) => !knownEpicIds.has(epic.id))
          .map((epic, index) => ({ ...epic, rank: nextEpicRank + index }));
        const newStories = stories.filter(
          (story) => !knownStoryIds.has(story.id),
        );
        set((current) => ({
          epics: [...current.epics, ...newEpics],
          stories: [...current.stories, ...newStories],
        }));
        // Give every newly imported story a readable key (TASK-064). Idempotent
        // per id, so a re-run only keys the genuinely new stories.
        const keyStore = useItemKeyStore.getState();
        newStories.forEach((story) =>
          keyStore.assignKey(story.id, story.projectId),
        );
      },

      removeProjectItems: (projectId) => {
        const orphanedStoryIds = get()
          .stories.filter((story) => story.projectId === projectId)
          .map((story) => story.id);
        set((state) => ({
          epics: state.epics.filter((epic) => epic.projectId !== projectId),
          stories: state.stories.filter(
            (story) => story.projectId !== projectId,
          ),
        }));
        detachStoryTasks(orphanedStoryIds);
      },

      detachRelease: (releaseId) =>
        set((state) => ({
          stories: state.stories.map((story) =>
            story.releaseId === releaseId
              ? { ...story, releaseId: undefined }
              : story,
          ),
        })),

      restore: ({ epics, stories }) => set({ epics, stories }),

      migrateFromArtifacts: (artifacts) => {
        if (get().artifactsMigrated) return;
        const epics: Epic[] = [];
        const stories: UserStory[] = [];
        for (const [projectId, bundle] of Object.entries(artifacts)) {
          const flat = flattenBacklog(projectId, bundle.backlog, "agent");
          epics.push(...flat.epics);
          stories.push(...flat.stories);
        }
        set((state) => ({
          // Keep anything already in the store first; the flag guards against
          // double-import, so this branch runs at most once.
          epics: [...state.epics, ...epics],
          stories: [...state.stories, ...stories],
          artifactsMigrated: true,
        }));
      },
    }),
    {
      name: "pm-studio-backlog",
      version: 2,
      // v1→v2 (TASK-058): lift string AKs to checkable AcceptanceCriterion[].
      migrate: migrateBacklogPersistedState,
      partialize: (state) => ({
        epics: state.epics,
        stories: state.stories,
        artifactsMigrated: state.artifactsMigrated,
      }),
      // One-time promotion of legacy artifact backlogs, read directly from the
      // persisted project store (no import cycle, order-independent). Deferred to
      // a microtask so it runs after this store finished hydrating.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const run = () =>
          useBacklogStore
            .getState()
            .migrateFromArtifacts(readPersistedArtifacts());
        if (typeof queueMicrotask === "function") queueMicrotask(run);
        else void Promise.resolve().then(run);
      },
    },
  ),
);
