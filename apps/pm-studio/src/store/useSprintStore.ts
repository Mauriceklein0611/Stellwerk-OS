import { create } from "zustand";
import { persist } from "zustand/middleware";

import { addComment, removeComment, toggleLink } from "@/lib/ceremonies";
import { logActivity } from "@/store/useActivityStore";
import type {
  CeremonyComment,
  CeremonyMeta,
  PlannedSprint,
  SprintRetro,
  SprintReview,
  SprintSuggestion,
} from "@/types";

/** Which ceremony list an action targets. */
type CeremonyKind = "review" | "retro";

type SprintState = {
  sprints: PlannedSprint[];
  /** Sprint reviews as a historical list – several per sprint (TASK-054). */
  reviews: SprintReview[];
  /** Sprint retrospectives as a historical list – several per sprint (TASK-054). */
  retros: SprintRetro[];
  /** Create a sprint; order is assigned at the end of its project's list. */
  addSprint: (sprint: Omit<PlannedSprint, "order">) => void;
  updateSprint: (
    id: string,
    patch: Partial<Omit<PlannedSprint, "id" | "projectId">>,
  ) => void;
  /** Remove a sprint; its stories fall back to "unassigned", review/retro drop. */
  removeSprint: (id: string) => void;
  /** Append a review to the history (TASK-054; several per sprint allowed). */
  addReview: (review: SprintReview) => void;
  /** Append a retro to the history (TASK-054; several per sprint allowed). */
  addRetro: (retro: SprintRetro) => void;
  /** Toggle a linked story on a review/retro (TASK-055). */
  toggleCeremonyStory: (kind: CeremonyKind, entryId: string, storyId: string) => void;
  /** Toggle a linked board task on a review/retro (TASK-055). */
  toggleCeremonyTask: (kind: CeremonyKind, entryId: string, taskId: string) => void;
  /** Append a comment to a review/retro's thread (TASK-055). */
  addCeremonyComment: (
    kind: CeremonyKind,
    entryId: string,
    comment: CeremonyComment,
  ) => void;
  /** Remove a comment from a review/retro's thread (TASK-055). */
  removeCeremonyComment: (
    kind: CeremonyKind,
    entryId: string,
    commentId: string,
  ) => void;
  /** Move a story to a sprint, or unassign it (sprintId = null). */
  assignStory: (storyId: string, sprintId: string | null) => void;
  /** Create sprints from the Scrum agent's suggestions (skips duplicates by name). */
  importSuggestions: (
    projectId: string,
    suggestions: SprintSuggestion[],
  ) => void;
  /**
   * Replace all sprints of `releaseId` with `generated` (idempotent re-generate):
   * existing release sprints are dropped, the generated ones appended after the
   * project's manual sprints. Manual sprints (no releaseId) stay untouched.
   */
  setReleaseSprints: (releaseId: string, generated: PlannedSprint[]) => void;
  /** Decouple a release's sprints (releaseId → undefined) without deleting them. */
  detachRelease: (releaseId: string) => void;
  /** Restore the sprints list from a snapshot (TASK-040 safe-delete Undo). */
  restore: (sprints: PlannedSprint[]) => void;
};

function nextOrder(sprints: PlannedSprint[], projectId: string): number {
  const projectSprints = sprints.filter((s) => s.projectId === projectId);
  return projectSprints.length
    ? Math.max(...projectSprints.map((s) => s.order)) + 1
    : 0;
}

/**
 * Backfill TASK-018 ceremony entries (no id/scope/createdAt) into the TASK-054
 * list shape. Legacy entries get a fresh id, `cross` scope (scope did not exist
 * yet) and an epoch `createdAt` so they sort to the bottom of "newest first"
 * (their real creation time is unknown). Content is preserved verbatim.
 */
const LEGACY_CREATED_AT = new Date(0).toISOString();

function backfillCeremony<T extends { id?: string; scope?: string; createdAt?: string }>(
  entry: T,
): T & { id: string; scope: string; createdAt: string } {
  return {
    ...entry,
    id: entry.id ?? crypto.randomUUID(),
    scope: entry.scope ?? "cross",
    createdAt: entry.createdAt ?? LEGACY_CREATED_AT,
  };
}

/**
 * Patch a single ceremony entry in the matching list (TASK-055). `fn` returns a
 * partial meta patch (linked ids / comments); reviews and retros share the
 * CeremonyMeta shape, so one helper covers both kinds.
 */
function patchEntry(
  state: SprintState,
  kind: CeremonyKind,
  entryId: string,
  fn: (meta: CeremonyMeta) => Partial<CeremonyMeta>,
): Partial<SprintState> {
  if (kind === "review") {
    return {
      reviews: state.reviews.map((r) =>
        r.id === entryId ? { ...r, ...fn(r) } : r,
      ),
    };
  }
  return {
    retros: state.retros.map((r) =>
      r.id === entryId ? { ...r, ...fn(r) } : r,
    ),
  };
}

/** Remove a story id from every sprint (a story belongs to one sprint at most). */
function detach(sprints: PlannedSprint[], storyId: string): PlannedSprint[] {
  return sprints.map((sprint) =>
    sprint.storyIds.includes(storyId)
      ? { ...sprint, storyIds: sprint.storyIds.filter((id) => id !== storyId) }
      : sprint,
  );
}

export const useSprintStore = create<SprintState>()(
  persist(
    (set, get) => ({
      sprints: [],
      reviews: [],
      retros: [],
      addSprint: (sprint) => {
        set((state) => ({
          sprints: [
            ...state.sprints,
            { ...sprint, order: nextOrder(state.sprints, sprint.projectId) },
          ],
        }));
        logActivity({
          entityType: "sprint",
          entityId: sprint.id,
          kind: "create",
          summary: `Sprint „${sprint.name}“ angelegt`,
        });
      },
      updateSprint: (id, patch) => {
        const before = get().sprints.find((sprint) => sprint.id === id);
        set((state) => ({
          sprints: state.sprints.map((sprint) =>
            sprint.id === id ? { ...sprint, ...patch } : sprint,
          ),
        }));
        if (before) {
          logActivity({
            entityType: "sprint",
            entityId: id,
            kind: "update",
            summary: `Sprint „${patch.name ?? before.name}“ aktualisiert`,
          });
        }
      },
      removeSprint: (id) => {
        const before = get().sprints.find((sprint) => sprint.id === id);
        set((state) => ({
          sprints: state.sprints.filter((sprint) => sprint.id !== id),
          // Drop the sprint's review/retro so they don't dangle (TASK-018).
          reviews: state.reviews.filter((review) => review.sprintId !== id),
          retros: state.retros.filter((retro) => retro.sprintId !== id),
        }));
        if (before) {
          logActivity({
            entityType: "sprint",
            entityId: id,
            kind: "delete",
            summary: `Sprint „${before.name}“ gelöscht`,
          });
        }
      },
      addReview: (review) =>
        set((state) => ({ reviews: [...state.reviews, review] })),
      addRetro: (retro) =>
        set((state) => ({ retros: [...state.retros, retro] })),
      toggleCeremonyStory: (kind, entryId, storyId) =>
        set((state) =>
          patchEntry(state, kind, entryId, (meta) => ({
            linkedStoryIds: toggleLink(meta.linkedStoryIds, storyId),
          })),
        ),
      toggleCeremonyTask: (kind, entryId, taskId) =>
        set((state) =>
          patchEntry(state, kind, entryId, (meta) => ({
            linkedTaskIds: toggleLink(meta.linkedTaskIds, taskId),
          })),
        ),
      addCeremonyComment: (kind, entryId, comment) =>
        set((state) =>
          patchEntry(state, kind, entryId, (meta) => ({
            comments: addComment(meta.comments, comment),
          })),
        ),
      removeCeremonyComment: (kind, entryId, commentId) =>
        set((state) =>
          patchEntry(state, kind, entryId, (meta) => ({
            comments: removeComment(meta.comments, commentId),
          })),
        ),
      assignStory: (storyId, sprintId) =>
        set((state) => {
          const detached = detach(state.sprints, storyId);
          if (!sprintId) return { sprints: detached };
          return {
            sprints: detached.map((sprint) =>
              sprint.id === sprintId
                ? { ...sprint, storyIds: [...sprint.storyIds, storyId] }
                : sprint,
            ),
          };
        }),
      importSuggestions: (projectId, suggestions) =>
        set((state) => {
          const existingNames = new Set(
            state.sprints
              .filter((s) => s.projectId === projectId)
              .map((s) => s.name),
          );

          let sprints = [...state.sprints];
          let order = nextOrder(sprints, projectId);

          for (const suggestion of suggestions) {
            if (existingNames.has(suggestion.name)) continue;
            // A story may only live in one sprint – detach from any existing.
            for (const storyId of suggestion.story_ids)
              sprints = detach(sprints, storyId);

            sprints.push({
              id: crypto.randomUUID(),
              projectId,
              name: suggestion.name,
              goal: suggestion.goal,
              status: "planned",
              storyIds: [...suggestion.story_ids],
              order: order++,
            });
            existingNames.add(suggestion.name);
          }

          return { sprints };
        }),
      setReleaseSprints: (releaseId, generated) =>
        set((state) => {
          const others = state.sprints.filter((s) => s.releaseId !== releaseId);
          const projectId = generated[0]?.projectId;
          if (projectId === undefined) return { sprints: others };

          // Append after the project's existing sprints; reindex order so the
          // generated set stays contiguous and re-generating is stable.
          const base = nextOrder(others, projectId);
          const reindexed = generated.map((sprint, index) => ({
            ...sprint,
            order: base + index,
          }));
          return { sprints: [...others, ...reindexed] };
        }),
      detachRelease: (releaseId) =>
        set((state) => ({
          sprints: state.sprints.map((sprint) =>
            sprint.releaseId === releaseId
              ? { ...sprint, releaseId: undefined }
              : sprint,
          ),
        })),
      restore: (sprints) => set({ sprints }),
    }),
    {
      name: "pm-studio-sprints",
      version: 2,
      // v1→v2 (TASK-054): reviews/retros became a historical list with ceremony
      // metadata. Backfill legacy TASK-018 upsert entries losslessly; a bump
      // without migrate would drop the persisted ceremonies.
      // TASK-055 adds linkedStoryIds/linkedTaskIds/comments – all optional and
      // additive, so no version bump is needed (v2 stock stays valid).
      migrate: (persisted, version) => {
        const state = persisted as Partial<SprintState> | undefined;
        if (!state) return persisted;
        if (version < 2) {
          state.reviews = (state.reviews ?? []).map((r) =>
            backfillCeremony(r as SprintReview),
          ) as SprintReview[];
          state.retros = (state.retros ?? []).map((r) =>
            backfillCeremony(r as SprintRetro),
          ) as SprintRetro[];
        }
        return state;
      },
      partialize: (state) => ({
        sprints: state.sprints,
        reviews: state.reviews,
        retros: state.retros,
      }),
    },
  ),
);
