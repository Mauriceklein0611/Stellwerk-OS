import type { AgentRun } from "@/types";

export type StepKey =
  | "draft"
  | "requirements"
  | "scrum"
  | "po"
  | "risk"
  | "review";

/**
 * `awaiting_review` (TASK-060): the step produced a result that waits for an
 * explicit human gate before the pipeline continues. Additive/display-only – the
 * batch pipeline (`computeStepStatuses`) never emits it, only the backlog agent
 * panel's phase mapping does.
 */
export type StepStatus = "done" | "running" | "pending" | "awaiting_review";

/** Tab a step jumps to when clicked (po/review have no own tab → overview). */
export type StepTab =
  | "overview"
  | "draft"
  | "requirements"
  | "backlog"
  | "risks";

export type PipelineStep = {
  key: StepKey;
  label: string;
  /** Agent name in AgentRun, or null for steps the mock pipeline doesn't run. */
  agent: string | null;
  tab: StepTab;
};

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: "draft", label: "Draft", agent: "Draft-Agent", tab: "draft" },
  { key: "requirements", label: "Requirements", agent: "Requirements-Agent", tab: "requirements" },
  { key: "scrum", label: "Scrum", agent: "Scrum-Agent", tab: "backlog" },
  { key: "po", label: "PO", agent: null, tab: "overview" },
  { key: "risk", label: "Risk", agent: "Risk-Agent", tab: "risks" },
  { key: "review", label: "Review", agent: null, tab: "overview" },
];

/** Steps the mock pipeline actually produces artifacts for. */
const ARTIFACT_STEPS: StepKey[] = ["draft", "requirements", "scrum", "risk"];

/**
 * Derive each step's status from the project's agent runs.
 * - done: a run exists for the step's agent, or (after reload) artifacts exist.
 * - running: while a pipeline runs, the first not-yet-done agent step.
 * - pending: otherwise (incl. PO/Review, which the mock doesn't run).
 */
export function computeStepStatuses(
  runs: AgentRun[],
  isRunning: boolean,
  hasArtifacts: boolean,
): Record<StepKey, StepStatus> {
  const doneAgents = new Set(runs.map((run) => run.agent));

  const statuses = {} as Record<StepKey, StepStatus>;
  for (const step of PIPELINE_STEPS) {
    const doneByRun = step.agent !== null && doneAgents.has(step.agent);
    const doneByArtifact = hasArtifacts && ARTIFACT_STEPS.includes(step.key);
    statuses[step.key] = doneByRun || doneByArtifact ? "done" : "pending";
  }

  if (isRunning) {
    for (const step of PIPELINE_STEPS) {
      if (step.agent !== null && statuses[step.key] !== "done") {
        statuses[step.key] = "running";
        break;
      }
    }
  }

  return statuses;
}

/**
 * Phase of the guided backlog-planning session (TASK-060). Owned conceptually by
 * the pipeline (the lib stays store-free); `useProposalStore` re-exports it as
 * its session state so the store never imports back into a component.
 */
export type PlanningPhase =
  | "idle"
  | "chatting"
  | "draft_review"
  | "requirements_review"
  | "proposals";

/**
 * Map a planning phase to per-step statuses for the header stepper (TASK-060).
 * The mockup only drives draft → requirements → scrum; PO/Risk/Review stay
 * pending (they get wired to the real gates in M6/M7). `hasProposals` lets the
 * page mark the Scrum step `done` once every proposal was handled.
 */
export function stepStatusesForPhase(
  phase: PlanningPhase,
  hasProposals = true,
): Record<StepKey, StepStatus> {
  const base: Record<StepKey, StepStatus> = {
    draft: "pending",
    requirements: "pending",
    scrum: "pending",
    po: "pending",
    risk: "pending",
    review: "pending",
  };
  switch (phase) {
    case "idle":
      return base;
    case "chatting":
      return { ...base, draft: "running" };
    case "draft_review":
      return { ...base, draft: "awaiting_review" };
    case "requirements_review":
      return { ...base, draft: "done", requirements: "awaiting_review" };
    case "proposals":
      return {
        ...base,
        draft: "done",
        requirements: "done",
        scrum: hasProposals ? "awaiting_review" : "done",
      };
  }
}
