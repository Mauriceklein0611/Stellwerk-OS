import { create } from "zustand";

import type { AgentRun, AgentRunRecord, StatusType } from "@/types";
import { seedAgentRuns, seedAgentStatuses } from "@/data/agents";

type AgentState = {
  /** Runs of the current/last pipeline, newest first. */
  runs: AgentRun[];
  /** Current status line while a pipeline is running. */
  status: string | null;
  isRunning: boolean;
  /** Per-agent status (agent overview, TASK-005). */
  agentStatuses: Record<string, StatusType>;
  /** Per-agent run history (newest first). */
  agentRuns: Record<string, AgentRunRecord[]>;
  addRun: (run: AgentRun) => void;
  setStatus: (status: string | null) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
  /** Simulate a single agent run: running for 3s, then success + a new run. */
  simulateAgentRun: (agentId: string) => void;
};

/**
 * Transient agent state. The pipeline part (runs/status/isRunning) is filled by
 * runPipelineForIdea; the per-agent part (agentStatuses/agentRuns) powers the
 * agent overview and is seeded from src/data/agents.
 */
export const useAgentStore = create<AgentState>((set) => ({
  runs: [],
  status: null,
  isRunning: false,
  agentStatuses: { ...seedAgentStatuses },
  agentRuns: { ...seedAgentRuns },
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  setStatus: (status) => set({ status }),
  setRunning: (isRunning) => set({ isRunning }),
  reset: () => set({ runs: [], status: null, isRunning: false }),
  simulateAgentRun: (agentId) => {
    set((state) => ({
      agentStatuses: { ...state.agentStatuses, [agentId]: "running" },
    }));
    setTimeout(() => {
      set((state) => {
        const run: AgentRunRecord = {
          id: crypto.randomUUID(),
          agentId,
          status: "success",
          timestamp: new Date().toISOString(),
          summary: "Simulierter Lauf erfolgreich",
          output: { simulated: true, agent: agentId },
        };
        return {
          agentStatuses: { ...state.agentStatuses, [agentId]: "success" },
          agentRuns: {
            ...state.agentRuns,
            [agentId]: [run, ...(state.agentRuns[agentId] ?? [])],
          },
        };
      });
    }, 3000);
  },
}));
