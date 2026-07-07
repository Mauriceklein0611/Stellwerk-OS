import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useBacklogStore } from "@/store/useBacklogStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { useRiskStore } from "@/store/useRiskStore";
import { logActivity } from "@/store/useActivityStore";
import { withRiskStatus } from "@/lib/risk";
import type { ProjectArtifacts, ProjectIdea } from "@/types";

type ProjectState = {
  ideas: ProjectIdea[];
  /** Pipeline artifacts per idea id (draft, requirements, backlog, risks). */
  artifacts: Record<string, ProjectArtifacts>;
  addIdea: (idea: ProjectIdea) => void;
  removeIdea: (id: string) => void;
  setArtifacts: (ideaId: string, artifacts: ProjectArtifacts) => void;
  /**
   * Restore ideas + artifacts from a snapshot (TASK-040 safe-delete Undo). The
   * board task snapshot (story links dropped on delete) is restored separately
   * via useBoardStore.restore.
   */
  restore: (snapshot: {
    ideas: ProjectIdea[];
    artifacts: Record<string, ProjectArtifacts>;
  }) => void;
};

/**
 * Project ideas and their generated artifacts, persisted to localStorage.
 * The idea form writes ideas, the pipeline (runPipelineForIdea) writes
 * artifacts. Replaced by the backend store from M6 on.
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ideas: [],
      artifacts: {},
      addIdea: (idea) => {
        set((state) => ({ ideas: [idea, ...state.ideas] }));
        // Register the project's item-key prefix up front (TASK-064) so every
        // story/task created later gets a `PMS-…` key. Leaf store, no cycle.
        useItemKeyStore.getState().registerProject(idea.id, idea.name);
        logActivity({
          entityType: "project",
          entityId: idea.id,
          kind: "create",
          summary: `Projekt „${idea.name}“ angelegt`,
        });
      },
      removeIdea: (id) => {
        const before = get().ideas.find((idea) => idea.id === id);
        // The removed project's backlog entities vanish – the backlog store
        // owns the cascade (delete its epics/stories + detach their board tasks).
        // Called outside the set updater so the updater stays pure (TASK-056).
        useBacklogStore.getState().removeProjectItems(id);
        // Same for the project's risk register (TASK-061).
        useRiskStore.getState().removeProjectRisks(id);
        set((state) => {
          const artifacts = { ...state.artifacts };
          delete artifacts[id];
          return { ideas: state.ideas.filter((i) => i.id !== id), artifacts };
        });
        if (before) {
          logActivity({
            entityType: "project",
            entityId: id,
            kind: "delete",
            summary: `Projekt „${before.name}“ gelöscht`,
          });
        }
      },
      // Store the run snapshot only. Since TASK-056 the backlog store is the
      // source of truth for stories – regenerating no longer detaches tasks
      // (importBacklog is purely additive). See runPipelineForIdea.
      setArtifacts: (ideaId, artifacts) =>
        set((state) => ({
          artifacts: { ...state.artifacts, [ideaId]: artifacts },
        })),
      restore: ({ ideas, artifacts }) => set({ ideas, artifacts }),
    }),
    {
      name: "pm-studio-projects",
      version: 2,
      // v1→v2 (TASK-045): backfill RiskEntry.status so agent-generated risks
      // persisted before the editable register stay valid (default "open").
      migrate: (persisted, version) => {
        const state = persisted as ProjectState;
        if (version < 2 && state?.artifacts) {
          const artifacts: Record<string, ProjectArtifacts> = {};
          for (const [id, bundle] of Object.entries(state.artifacts)) {
            artifacts[id] = {
              ...bundle,
              risks: { risks: bundle.risks.risks.map(withRiskStatus) },
            };
          }
          return { ...state, artifacts };
        }
        return state;
      },
      partialize: (state) => ({
        ideas: state.ideas,
        artifacts: state.artifacts,
      }),
    },
  ),
);
