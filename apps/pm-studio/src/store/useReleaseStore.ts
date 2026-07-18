import { create } from "zustand";
import { persist } from "zustand/middleware";

import { logActivity } from "@/store/useActivityStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { Release, ReleaseStatus } from "@/types";

/** A persisted release before v2 may lack the `status` field (TASK-041). */
type LegacyRelease = Omit<Release, "status"> & { status?: ReleaseStatus };

type ReleaseState = {
  releases: Release[];
  addRelease: (release: Release) => void;
  updateRelease: (id: string, patch: Partial<Omit<Release, "id">>) => void;
  removeRelease: (id: string) => void;
  /** Restore the releases list from a snapshot (TASK-040 safe-delete Undo). */
  restore: (releases: Release[]) => void;
};

/**
 * Releases as first-class delivery containers (TASK-025). Persisted locally.
 * Sprint generation lives in `src/lib/release.ts`; the sprint store owns the
 * idempotent insert (`setReleaseSprints`) and the decoupling on delete
 * (`detachRelease`), so removing a release here never loses its sprints.
 */
export const useReleaseStore = create<ReleaseState>()(
  persist(
    (set, get) => ({
      releases: [],
      addRelease: (release) => {
        set((state) => ({ releases: [...state.releases, release] }));
        logActivity({
          entityType: "release",
          entityId: release.id,
          kind: "create",
          summary: `Release „${release.name}“ angelegt`,
        });
      },
      updateRelease: (id, patch) => {
        const before = get().releases.find((release) => release.id === id);
        set((state) => ({
          releases: state.releases.map((release) =>
            release.id === id ? { ...release, ...patch } : release,
          ),
        }));
        if (before) {
          logActivity({
            entityType: "release",
            entityId: id,
            kind: "update",
            summary: `Release „${patch.name ?? before.name}“ aktualisiert`,
          });
        }
      },
      removeRelease: (id) => {
        const before = get().releases.find((release) => release.id === id);
        set((state) => ({
          releases: state.releases.filter((release) => release.id !== id),
        }));
        // Detach the deleted release from every story so no `releaseId` dangles
        // (TASK-062). The sprint store's `detachRelease` handles the sprints.
        useBacklogStore.getState().detachRelease(id);
        if (before) {
          logActivity({
            entityType: "release",
            entityId: id,
            kind: "delete",
            summary: `Release „${before.name}“ gelöscht`,
          });
        }
      },
      restore: (releases) => set({ releases }),
    }),
    {
      name: "pm-studio-releases",
      version: 2,
      partialize: (state) => ({ releases: state.releases }),
      // v1→v2 (TASK-041): releases gained a lifecycle `status`. Additive – old
      // releases without one are lifted to "planned" so they stay valid.
      migrate: (persisted, version) => {
        const state = persisted as { releases?: LegacyRelease[] };
        if (version < 2 && Array.isArray(state.releases)) {
          state.releases = state.releases.map((release) => ({
            status: "planned",
            ...release,
          }));
        }
        return state as { releases: Release[] };
      },
    },
  ),
);
