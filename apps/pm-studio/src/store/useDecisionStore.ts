import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createDecision, type DecisionInput } from "@/lib/decision";
import type { Decision } from "@/types";

type DecisionState = {
  /** Human approvals and scope decisions (TASK-043), append-only. */
  decisions: Decision[];
  /**
   * Record a decision. Blank context/choice are ignored (the factory returns
   * null), so the log never holds an empty entry.
   */
  addDecision: (input: DecisionInput) => void;
  removeDecision: (id: string) => void;
  /** Restore the decisions list from a snapshot (parity with TASK-040). */
  restore: (decisions: Decision[]) => void;
};

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => ({
      decisions: [],
      addDecision: (input) =>
        set((state) => {
          const decision = createDecision(input);
          if (!decision) return state;
          return { decisions: [...state.decisions, decision] };
        }),
      removeDecision: (id) =>
        set((state) => ({
          decisions: state.decisions.filter((decision) => decision.id !== id),
        })),
      restore: (decisions) => set({ decisions }),
    }),
    {
      name: "pm-studio-decisions",
      version: 1,
      partialize: (state) => ({ decisions: state.decisions }),
    },
  ),
);
