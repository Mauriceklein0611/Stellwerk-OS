import { create } from "zustand";
import { persist } from "zustand/middleware";

import { withRiskStatus } from "@/lib/risk";
import type { ProjectArtifacts, RiskEntry } from "@/types";

/**
 * Read the legacy artifact risk registers straight from the persisted project
 * store (`pm-studio-projects`) in localStorage. Reading storage directly (instead
 * of importing `useProjectStore`) avoids a store-init import cycle and is immune
 * to hydration order – the same pattern the backlog store uses (TASK-056).
 * Returns {} on SSR or malformed/missing data.
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

type RiskState = {
  /** Editable risk register per project id (TASK-061). */
  risks: Record<string, RiskEntry[]>;
  /**
   * One-time flag: the legacy artifact risk registers (`artifacts[*].risks`)
   * were already promoted into this store. Prevents re-importing them on every
   * hydrate (which would resurrect deleted risks).
   */
  artifactsMigrated: boolean;

  /**
   * Replace the whole risk array of a project (TASK-045 API preserved). The risk
   * table edits transactionally and hands back the full next array. Unlike the
   * old project-store version this is NOT a no-op without artifacts – risks now
   * exist independently of a pipeline run.
   */
  setRisks: (projectId: string, risks: RiskEntry[]) => void;

  /**
   * Import an agent-generated risk register into the store (TASK-061). Adds only
   * risks whose id is not present yet – it never replaces existing (possibly
   * human-edited) risks, so a re-run of the pipeline is purely additive and
   * idempotent over the artifact risk ids (mirrors backlog `importBacklog`).
   */
  importRisks: (projectId: string, risks: RiskEntry[]) => void;

  /** Remove all risks of a project (cascade on project delete). */
  removeProjectRisks: (projectId: string) => void;

  /** Restore the whole slice from a snapshot (TASK-040 safe-delete Undo). */
  restore: (snapshot: { risks: Record<string, RiskEntry[]> }) => void;

  /**
   * One-time promotion of legacy artifact risks into the store. Pure over the
   * passed map so it is unit-testable; no-op once `artifactsMigrated` is true.
   * Existing store entries win over legacy ones (a user edit is never clobbered).
   */
  migrateFromArtifacts: (artifacts: Record<string, ProjectArtifacts>) => void;
};

/**
 * Risk register entities as the single source of truth (TASK-061). Previously
 * risks only lived nested inside the pipeline artifact (`ProjectArtifacts.risks`)
 * and were edited via a `setRisks` patch on the project store. Now they are a
 * first-class, CRUD-able, per-project collection that exists without a pipeline
 * run; the artifact stays as a run snapshot but the UI reads/writes here.
 */
export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      risks: {},
      artifactsMigrated: false,

      setRisks: (projectId, risks) =>
        set((state) => ({
          risks: { ...state.risks, [projectId]: risks },
        })),

      importRisks: (projectId, incoming) =>
        set((state) => {
          const existing = state.risks[projectId] ?? [];
          const knownIds = new Set(existing.map((risk) => risk.id));
          const additions = incoming
            .map(withRiskStatus)
            .filter((risk) => !knownIds.has(risk.id));
          if (additions.length === 0) return state;
          return {
            risks: {
              ...state.risks,
              [projectId]: [...existing, ...additions],
            },
          };
        }),

      removeProjectRisks: (projectId) =>
        set((state) => {
          if (!(projectId in state.risks)) return state;
          const risks = { ...state.risks };
          delete risks[projectId];
          return { risks };
        }),

      restore: ({ risks }) => set({ risks }),

      migrateFromArtifacts: (artifacts) => {
        if (get().artifactsMigrated) return;
        const migrated: Record<string, RiskEntry[]> = {};
        for (const [projectId, bundle] of Object.entries(artifacts)) {
          const list = bundle.risks?.risks ?? [];
          if (list.length > 0) migrated[projectId] = list.map(withRiskStatus);
        }
        set((state) => ({
          // Existing store entries win over legacy imports so a user edit made
          // before this migration ran is never clobbered; the flag guards
          // against double-import, so this branch runs at most once.
          risks: { ...migrated, ...state.risks },
          artifactsMigrated: true,
        }));
      },
    }),
    {
      name: "pm-studio-risks",
      version: 1,
      partialize: (state) => ({
        risks: state.risks,
        artifactsMigrated: state.artifactsMigrated,
      }),
      // One-time promotion of legacy artifact risks, read directly from the
      // persisted project store (no import cycle, order-independent). Deferred to
      // a microtask so it runs after this store finished hydrating.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const run = () =>
          useRiskStore
            .getState()
            .migrateFromArtifacts(readPersistedArtifacts());
        if (typeof queueMicrotask === "function") queueMicrotask(run);
        else void Promise.resolve().then(run);
      },
    },
  ),
);
